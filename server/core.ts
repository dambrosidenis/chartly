import { getConfig } from './config';
import { getCachedSchemaSummary } from './schemaService';
import { callLLM, callSchemaInvestigationLLM, generateExampleQuestions, LLMContext } from './llmService';
import { executeQuery } from './queryRunner';
import { SuccessResponse, ErrorResponse, Attempt, ChartSpec, SchemaInvestigationResult } from './validator';

export async function runQuestion(query: string): Promise<SuccessResponse | ErrorResponse> {
  const config = getConfig();
  const attempts: Attempt[] = [];
  
  try {
    // Get schema summary
    console.log('Loading schema summary...');
    const schemaSummary = await getCachedSchemaSummary();
    
    // Main orchestration loop
    for (let attemptNum = 1; attemptNum <= config.MAX_ATTEMPTS; attemptNum++) {
      console.log(`Starting attempt ${attemptNum}/${config.MAX_ATTEMPTS}`);
      
      // Build LLM context
      const llmContext: LLMContext = {
        userQuery: query,
        schemaSummary,
        previousAttempts: attempts.length > 0 ? attempts : undefined,
      };
      
      // Call LLM
      const llmResult = await callLLM(llmContext);
      if (!llmResult.success) {
        console.error(`LLM call failed on attempt ${attemptNum}:`, llmResult.error);
        
        // If this is the last attempt, return error
        if (attemptNum === config.MAX_ATTEMPTS) {
          return {
            prompt: query,
            error: `LLM failed after ${config.MAX_ATTEMPTS} attempts: ${llmResult.error}`,
            tried: attempts,
          };
        }
        
        // Record attempt and continue
        attempts.push({
          step: attemptNum,
          sql: '',
          diagnostic: false,
          error: llmResult.error,
        });
        continue;
      }
      
      const llmOutput = llmResult.output;
      console.log(`LLM output - diagnostic: ${llmOutput.diagnostic}, chartType: ${llmOutput.chartType}`);
      
      // Execute SQL
      const queryOptions = {
        timeout: llmOutput.diagnostic ? 1500 : config.QUERY_TIMEOUT_MS,
        maxRows: llmOutput.diagnostic ? 100 : config.MAX_RESULT_ROWS,
        isDiagnostic: llmOutput.diagnostic,
      };
      
      const queryResult = await executeQuery(llmOutput.sql, queryOptions);
      
      if (queryResult.success) {
        if (llmOutput.diagnostic) {
          // This was a diagnostic query - summarize results and continue
          console.log(`Diagnostic query returned ${queryResult.result.rowCount} rows`);
          
          const sampleMeta = summarizeDiagnosticResults(queryResult.result.rows);
          
          attempts.push({
            step: attemptNum,
            sql: llmOutput.sql,
            diagnostic: true,
            sampleMeta,
          });
          
          // Add diagnostic metadata to next LLM context
          llmContext.diagnosticMetadata = sampleMeta;
          continue;
        } else {
          // Success! Return the result
          console.log(`Query succeeded with ${queryResult.result.rowCount} rows`);
          
          const chartSpec: ChartSpec = {
            chartType: llmOutput.chartType,
            title: llmOutput.title,
            mapping: llmOutput.mapping,
          };
          
          return {
            prompt: query,
            finalSql: llmOutput.sql,
            chartSpec,
            rows: queryResult.result.rows,
            tried: attempts,
          };
        }
      } else {
        // Query failed
        console.error(`Query failed on attempt ${attemptNum}:`, queryResult.error.message);
        
        attempts.push({
          step: attemptNum,
          sql: llmOutput.sql,
          diagnostic: llmOutput.diagnostic,
          error: queryResult.error.message,
        });
        
        // If this is the last attempt, return error
        if (attemptNum === config.MAX_ATTEMPTS) {
          return {
            prompt: query,
            error: `Query failed after ${config.MAX_ATTEMPTS} attempts. Last error: ${queryResult.error.message}`,
            tried: attempts,
          };
        }
        
        // Add error context for next attempt
        llmContext.lastError = queryResult.error.message;
      }
    }
    
    // This shouldn't be reached, but just in case
    return {
      prompt: query,
      error: `Exceeded maximum attempts (${config.MAX_ATTEMPTS})`,
      tried: attempts,
    };
    
  } catch (error: any) {
    console.error('Unexpected error in runQuestion:', error);
    return {
      prompt: query,
      error: `Unexpected error: ${error.message}`,
      tried: attempts,
    };
  }
}

function summarizeDiagnosticResults(rows: Record<string, any>[]): Record<string, any> {
  if (rows.length === 0) {
    return { rowCount: 0 };
  }
  
  const summary: Record<string, any> = {
    rowCount: rows.length,
    sampleRows: rows.slice(0, 3), // First 3 rows as examples
  };
  
  // Analyze each column
  const columns = Object.keys(rows[0]);
  const columnStats: Record<string, any> = {};
  
  for (const column of columns) {
    const values = rows.map(row => row[column]).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) {
      columnStats[column] = { type: 'null', distinctCount: 0 };
      continue;
    }
    
    const distinctValues = Array.from(new Set(values));
    const sampleValue = values[0];
    
    let columnType = 'unknown';
    if (typeof sampleValue === 'number') {
      columnType = 'numeric';
    } else if (sampleValue instanceof Date || (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)))) {
      columnType = 'date';
    } else if (typeof sampleValue === 'string') {
      columnType = 'text';
    }
    
    columnStats[column] = {
      type: columnType,
      distinctCount: distinctValues.length,
      sampleValues: distinctValues.slice(0, 5), // First 5 distinct values
    };
    
    // Add min/max for numeric columns
    if (columnType === 'numeric') {
      const numericValues = values.filter(v => typeof v === 'number');
      if (numericValues.length > 0) {
        columnStats[column].min = Math.min(...numericValues);
        columnStats[column].max = Math.max(...numericValues);
      }
    }
  }
  
  summary.columns = columnStats;
  return summary;
}

// Global cache for schema investigation results
let schemaInvestigationCache: {
  result: SchemaInvestigationResult;
  timestamp: number;
} | null = null;

export async function runSchemaInvestigation(): Promise<SchemaInvestigationResult> {
  const config = getConfig();
  
  // Check if investigation is disabled
  if (!config.ENABLE_SCHEMA_INVESTIGATION) {
    console.log('Schema investigation disabled, returning default examples');
    return {
      summary: 'Schema investigation disabled',
      examplePrompts: [
        "Show me the total count of records",
        "What are the main tables in this database?",
        "Give me a sample of the data"
      ],
      investigationSteps: [],
    };
  }
  
  // Check cache (valid for 1 hour)
  const now = Date.now();
  const cacheValidityMs = 60 * 60 * 1000; // 1 hour
  
  if (schemaInvestigationCache && (now - schemaInvestigationCache.timestamp) < cacheValidityMs) {
    console.log('Returning cached schema investigation results');
    return schemaInvestigationCache.result;
  }
  
  console.log('Starting schema investigation...');
  
  try {
    // Get schema summary
    const schemaSummary = await getCachedSchemaSummary();
    const investigationSteps: Attempt[] = [];
    const investigationFindings: string[] = [];
    
    // Run investigation loop
    for (let step = 1; step <= config.MAX_SCHEMA_INVESTIGATION_STEPS; step++) {
      console.log(`Schema investigation step ${step}/${config.MAX_SCHEMA_INVESTIGATION_STEPS}`);
      
      // Call LLM for investigation query
      const llmResult = await callSchemaInvestigationLLM(schemaSummary, investigationSteps, step);
      
      if (!llmResult.success) {
        console.error(`Investigation step ${step} LLM failed:`, llmResult.error);
        
        investigationSteps.push({
          step,
          sql: '',
          diagnostic: true,
          error: llmResult.error,
        });
        
        // Continue to next step on LLM failure
        continue;
      }
      
      const llmOutput = llmResult.output;
      console.log(`Investigation step ${step}: ${llmOutput.queryType} - ${llmOutput.explanation}`);
      
      // Execute the diagnostic query
      const queryResult = await executeQuery(llmOutput.sql, {
        timeout: 2000, // Short timeout for investigation
        maxRows: 100,  // Small result set
        isDiagnostic: true,
      });
      
      if (queryResult.success) {
        const sampleMeta = summarizeDiagnosticResults(queryResult.result.rows);
        
        investigationSteps.push({
          step,
          sql: llmOutput.sql,
          diagnostic: true,
          sampleMeta,
        });
        
        // Add findings to summary
        investigationFindings.push(`${llmOutput.queryType}: ${llmOutput.explanation} - Found ${queryResult.result.rowCount} rows`);
        
        if (sampleMeta.columns) {
          const columnSummary = Object.entries(sampleMeta.columns)
            .map(([col, stats]: [string, any]) => `${col} (${stats.type}, ${stats.distinctCount} distinct values)`)
            .join(', ');
          investigationFindings.push(`Columns analyzed: ${columnSummary}`);
        }
        
      } else {
        console.error(`Investigation step ${step} query failed:`, queryResult.error.message);
        
        investigationSteps.push({
          step,
          sql: llmOutput.sql,
          diagnostic: true,
          error: queryResult.error.message,
        });
      }
    }
    
    // Build investigation summary
    const investigationSummary = [
      'Database Schema Investigation Results:',
      '',
      'Schema:',
      schemaSummary,
      '',
      'Investigation Findings:',
      ...investigationFindings,
    ].join('\n');
    
    console.log('Generating example questions based on investigation...');
    
    // Generate example questions
    const exampleResult = await generateExampleQuestions(schemaSummary, investigationSummary);
    
    let examplePrompts: string[];
    if (exampleResult.success) {
      examplePrompts = exampleResult.questions;
    } else {
      console.error('Failed to generate examples:', exampleResult.error);
      // Fallback examples
      examplePrompts = [
        "Show me the total count of records",
        "What are the main data patterns?",
        "Give me a breakdown by category"
      ];
    }
    
    const result: SchemaInvestigationResult = {
      summary: investigationSummary,
      examplePrompts,
      investigationSteps,
    };
    
    // Cache the result
    schemaInvestigationCache = {
      result,
      timestamp: now,
    };
    
    console.log(`Schema investigation completed with ${investigationSteps.length} steps and ${examplePrompts.length} example questions`);
    return result;
    
  } catch (error: any) {
    console.error('Schema investigation failed:', error);
    
    // Return fallback result
    const fallbackResult: SchemaInvestigationResult = {
      summary: `Schema investigation failed: ${error.message}`,
      examplePrompts: [
        "Show me the data structure",
        "What tables are available?",
        "Give me a sample query"
      ],
      investigationSteps: [],
    };
    
    return fallbackResult;
  }
}

export function clearSchemaInvestigationCache(): void {
  schemaInvestigationCache = null;
}
