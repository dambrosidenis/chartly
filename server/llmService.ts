import { Mistral } from '@mistralai/mistralai';
import { getConfig } from './config';
import { validateLLMOutput, validateSchemaInvestigationOutput, LLMOutput, SchemaInvestigationOutput, Attempt } from './validator';

let mistralClient: Mistral | null = null;

function extractJSONFromResponse(content: string): string {
  // Remove code fences if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    console.log('Found code fences, extracting JSON...');
    return jsonMatch[1].trim();
  }
  
  // Look for JSON object boundaries with proper bracket counting
  const startIndex = content.indexOf('{');
  if (startIndex === -1) {
    return content.trim();
  }
  
  let bracketCount = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
      bracketCount++;
    } else if (content[i] === '}') {
      bracketCount--;
      if (bracketCount === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  if (endIndex !== -1) {
    console.log('Found JSON boundaries, extracting...');
    return content.substring(startIndex, endIndex + 1);
  }
  
  // Return original content if no patterns found
  console.log('No JSON patterns found, returning original content');
  return content.trim();
}

function getMistralClient(): Mistral {
  if (!mistralClient) {
    const config = getConfig();
    if (!config.MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is required but not configured');
    }
    mistralClient = new Mistral({
      apiKey: config.MISTRAL_API_KEY,
    });
  }
  return mistralClient;
}

export interface LLMContext {
  userQuery: string;
  schemaSummary: string;
  previousAttempts?: Attempt[];
  lastError?: string;
  diagnosticMetadata?: Record<string, any>;
}

function buildSystemPrompt(): string {
  return `You are a SQL expert that converts natural language questions into PostgreSQL queries and determines appropriate chart types.

STRICT RULES:
- PostgreSQL dialect only
- Read-only queries: SELECT statements only
- SQL must start with "SELECT" (no leading whitespace, comments, or other text)
- Single statement only (no semicolons, no comments)
- No SQL comments (-- or /* */)
- Clean, properly formatted SQL without extra whitespace

OUTPUT FORMAT:
- Return ONLY valid JSON matching the exact schema
- NO code fences, NO markdown formatting, NO prose
- Start directly with { and end with }
- No explanations outside the JSON object

CHART TYPE HEURISTICS:
- Single value results (MAX, MIN, COUNT, SUM without GROUP BY) → "table"
- Geographical data (country, region, location analysis) → "geo" (preferred for countries)
- Time series data (GROUP BY date/time) → "line" or "area"
- Small categorical data (≤10 categories) → "bar" or "pie"  
- Large categorical or unclear → "table"

GEOGRAPHICAL QUERIES:
- Questions about countries, regions, or locations should use "geo" chart type
- Examples: "by country", "countries with", "top countries", "which countries"

TIME BUCKETING:
- Use date_trunc('day', timestamp_col) AS x for daily aggregation
- Use date_trunc('week', timestamp_col) AS x for weekly aggregation
- Use date_trunc('month', timestamp_col) AS x for monthly aggregation
- Always ORDER BY x when using time bucketing

COLUMN MAPPING:
- Single value (no GROUP BY): use "table" chart type, column name as "x", value as "y"
- Single series: columns named "x" and "y"
- Multi-series (wide format): "x", "y1", "y2", etc. (mapping.y = ["y1", "y2"])
- Multi-series (long format): "x", "series", "y" (mapping.series = "series")
- Pie charts: "x" (category), "y" (value)

IMPORTANT: 
- For single maximum, minimum, count, or sum value without grouping → use "table"
- For country-based analysis (top countries, by country, country comparison) → use "geo"
- The "geo" chart type creates interactive world maps with country highlighting`;
}

function buildUserPrompt(context: LLMContext): string {
  let prompt = `Question: ${context.userQuery}

Database Schema:
${context.schemaSummary}`;

  if (context.previousAttempts && context.previousAttempts.length > 0) {
    prompt += '\n\nPrevious attempts:';
    for (const attempt of context.previousAttempts) {
      prompt += `\nAttempt ${attempt.step}: ${attempt.sql}`;
      if (attempt.error) {
        prompt += `\nError: ${attempt.error}`;
      }
      if (attempt.sampleMeta) {
        prompt += `\nDiagnostic info: ${JSON.stringify(attempt.sampleMeta)}`;
      }
    }
  }

  if (context.lastError) {
    prompt += `\n\nLast error: ${context.lastError}`;
  }

  if (context.diagnosticMetadata) {
    prompt += `\n\nDiagnostic metadata: ${JSON.stringify(context.diagnosticMetadata)}`;
  }

  prompt += `\n\nReturn valid JSON with this exact schema:
{
  "thought": "string - your reasoning",
  "chartType": "line|bar|area|pie|table|geo",
  "sql": "string - PostgreSQL SELECT query",
  "mapping": {
    "x": "string - x-axis column name",
    "y": "string or string[] - y-axis column name(s)",
    "series": "string or null - series grouping column (optional)"
  },
  "title": "string - chart title",
  "explanation": "string - brief explanation of the result",
  "diagnostic": false
}

For diagnostic queries, set "diagnostic": true and write a simple query to explore the data structure.`;

  return prompt;
}

function buildSchemaInvestigationSystemPrompt(): string {
  return `You are a database analyst that explores database schemas to understand the data structure and generate meaningful example queries.

STRICT RULES:
- PostgreSQL dialect only
- Read-only queries: SELECT statements only
- Single statement only (no semicolons, no comments)
- No SQL comments (-- or /* */)
- Use LIMIT to keep diagnostic queries fast (≤100 rows)

OUTPUT FORMAT:
- Return ONLY valid JSON matching the exact schema
- NO code fences, NO markdown formatting, NO prose
- Start directly with { and end with }
- No explanations outside the JSON object

INVESTIGATION TYPES:
- "explore_table": Get basic table structure and sample rows
- "sample_values": Sample distinct values from categorical columns
- "count_rows": Count total rows in tables
- "check_ranges": Find min/max values for numeric/date columns
- "analyze_relationships": Explore potential relationships between tables

GUIDELINES:
- Focus on understanding data patterns, ranges, and relationships
- Sample categorical columns to understand possible values
- Check numeric ranges to understand scales
- Look for foreign key relationships
- Keep queries simple and fast with appropriate LIMIT clauses`;
}

function buildSchemaInvestigationUserPrompt(
  schemaSummary: string, 
  previousSteps: Attempt[], 
  stepNumber: number
): string {
  let prompt = `Database Schema:
${schemaSummary}

Investigation Step ${stepNumber}:
Your goal is to explore and understand this database schema. Write a diagnostic SQL query to learn more about the data structure, patterns, or relationships.`;

  if (previousSteps.length > 0) {
    prompt += '\n\nPrevious investigation steps:';
    for (const step of previousSteps) {
      prompt += `\nStep ${step.step}: ${step.sql}`;
      if (step.sampleMeta) {
        prompt += `\nResults: ${JSON.stringify(step.sampleMeta)}`;
      }
    }
    prompt += '\n\nBased on previous findings, choose what to investigate next.';
  } else {
    prompt += '\n\nThis is the first investigation step. Start by exploring the main tables and their basic structure.';
  }

  prompt += `\n\nReturn valid JSON with this exact schema:
{
  "thought": "string - your reasoning for this investigation step",
  "queryType": "explore_table|sample_values|count_rows|check_ranges|analyze_relationships",
  "sql": "string - PostgreSQL SELECT query with appropriate LIMIT",
  "explanation": "string - what this query will reveal",
  "diagnostic": true
}`;

  return prompt;
}

function buildExampleGenerationPrompt(schemaSummary: string, investigationSummary: string): string {
  return `Based on the following database schema and investigation findings, generate 3-5 natural language questions that would be interesting and meaningful for users to ask.

Database Schema:
${schemaSummary}

Investigation Summary:
${investigationSummary}

Generate questions that:
- Are natural and conversational
- Are SHORT (maximum 5-6 words each)
- Cover different types of analysis (time series, aggregations, comparisons, geographical if applicable)
- Use the actual column names and values found in the data
- Are answerable with the available data
- Showcase different chart types (line charts for time series, bar charts for categories, geo charts for countries, etc.)

Return ONLY a JSON array of strings, no other text:
["question 1", "question 2", "question 3", "question 4", "question 5"]`;
}

export async function callLLM(context: LLMContext): Promise<{
  success: true;
  output: LLMOutput;
} | {
  success: false;
  error: string;
  rawResponse?: string;
}> {
  try {
    const config = getConfig();
    const client = getMistralClient();
    
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);
    
    console.log('Calling Mistral API...');
    
    const response = await client.chat.complete({
      model: config.MISTRAL_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      maxTokens: 1000,
    });
    
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'No response from Mistral API',
      };
    }
    
    // Handle both string and array content types
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    console.log('Mistral response:', contentString.substring(0, 200) + '...');
    
    // Extract JSON from code fences if present
    const cleanedContent = extractJSONFromResponse(contentString);
    console.log('Cleaned content:', cleanedContent.substring(0, 300) + '...');
    
    // Try to parse JSON
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(cleanedContent);
    } catch (parseError) {
      // Attempt JSON repair
      console.log('JSON parse failed, attempting repair...');
      const repairResult = await attemptJSONRepair(cleanedContent);
      if (!repairResult.success) {
        return {
          success: false,
          error: 'Invalid JSON response from LLM',
          rawResponse: contentString,
        };
      }
      parsedOutput = repairResult.parsed;
    }
    
    // Clean up the SQL field if it exists
    if (parsedOutput && parsedOutput.sql && typeof parsedOutput.sql === 'string') {
      // Clean up any formatting issues in the SQL
      parsedOutput.sql = parsedOutput.sql.trim();
      // Remove any leading/trailing whitespace and newlines
      parsedOutput.sql = parsedOutput.sql.replace(/^\s+|\s+$/g, '');
      // Remove any leading comments
      parsedOutput.sql = parsedOutput.sql.replace(/^--.*$/gm, '').trim();
      parsedOutput.sql = parsedOutput.sql.replace(/^\/\*[\s\S]*?\*\//, '').trim();
    }
    
    // Validate the output
    console.log('Parsed output:', JSON.stringify(parsedOutput, null, 2));
    const validation = validateLLMOutput(parsedOutput);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error || 'LLM output validation failed',
        rawResponse: contentString,
      };
    }
    
    return {
      success: true,
      output: validation.data!,
    };
    
  } catch (error: any) {
    console.error('LLM call failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown LLM error',
    };
  }
}

export async function callSchemaInvestigationLLM(
  schemaSummary: string, 
  previousSteps: Attempt[], 
  stepNumber: number
): Promise<{
  success: true;
  output: SchemaInvestigationOutput;
} | {
  success: false;
  error: string;
  rawResponse?: string;
}> {
  try {
    const config = getConfig();
    const client = getMistralClient();
    
    const systemPrompt = buildSchemaInvestigationSystemPrompt();
    const userPrompt = buildSchemaInvestigationUserPrompt(schemaSummary, previousSteps, stepNumber);
    
    console.log(`Schema investigation step ${stepNumber}...`);
    
    const response = await client.chat.complete({
      model: config.MISTRAL_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      maxTokens: 800,
    });
    
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'No response from Mistral API',
      };
    }
    
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanedContent = extractJSONFromResponse(contentString);
    
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(cleanedContent);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON response from LLM',
        rawResponse: contentString,
      };
    }
    
    const validation = validateSchemaInvestigationOutput(parsedOutput);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Schema investigation output validation failed',
        rawResponse: contentString,
      };
    }
    
    return {
      success: true,
      output: validation.data!,
    };
    
  } catch (error: any) {
    console.error('Schema investigation LLM call failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown LLM error',
    };
  }
}

export async function generateExampleQuestions(
  schemaSummary: string, 
  investigationSummary: string
): Promise<{
  success: true;
  questions: string[];
} | {
  success: false;
  error: string;
}> {
  try {
    const config = getConfig();
    const client = getMistralClient();
    
    const prompt = buildExampleGenerationPrompt(schemaSummary, investigationSummary);
    
    console.log('Generating example questions...');
    
    const response = await client.chat.complete({
      model: config.MISTRAL_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 500,
    });
    
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'No response from Mistral API',
      };
    }
    
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanedContent = extractJSONFromResponse(contentString);
    
    let questions;
    try {
      questions = JSON.parse(cleanedContent);
      if (!Array.isArray(questions) || questions.some(q => typeof q !== 'string')) {
        throw new Error('Invalid format');
      }
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON array response from LLM',
      };
    }
    
    return {
      success: true,
      questions: questions.slice(0, 5), // Ensure max 5 questions
    };
    
  } catch (error: any) {
    console.error('Example generation failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error generating examples',
    };
  }
}

async function attemptJSONRepair(content: string): Promise<{
  success: true;
  parsed: any;
} | {
  success: false;
  error: string;
}> {
  try {
    const config = getConfig();
    const client = getMistralClient();
    
    const repairResponse = await client.chat.complete({
      model: config.MISTRAL_MODEL,
      messages: [
        {
          role: 'user',
          content: `The following text should be valid JSON but has parsing errors. Return ONLY the corrected JSON object. NO code fences, NO markdown, NO explanations. Start with { and end with }:

${content}`
        }
      ],
      temperature: 0,
      maxTokens: 1000,
    });
    
    const repairedContent = repairResponse.choices?.[0]?.message?.content;
    if (!repairedContent) {
      return { success: false, error: 'No repair response' };
    }
    
    const repairedContentString = typeof repairedContent === 'string' ? repairedContent : JSON.stringify(repairedContent);
    const cleanedRepairedContent = extractJSONFromResponse(repairedContentString);
    const parsed = JSON.parse(cleanedRepairedContent);
    return { success: true, parsed };
    
  } catch (error) {
    return { success: false, error: 'JSON repair failed' };
  }
}
