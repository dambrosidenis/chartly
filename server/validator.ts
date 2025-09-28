import { z } from 'zod';

// Client request schema
export const askRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(1000, 'Query too long'),
});

export type AskRequest = z.infer<typeof askRequestSchema>;

// LLM output schema
export const llmOutputSchema = z.object({
  thought: z.string(),
  chartType: z.enum(['line', 'bar', 'area', 'pie', 'table', 'geo']),
  sql: z.string(),
  mapping: z.object({
    x: z.string(),
    y: z.union([z.string(), z.array(z.string())]),
    series: z.string().nullable().optional(),
  }),
  title: z.string(),
  explanation: z.string(),
  diagnostic: z.boolean(),
});

export type LLMOutput = z.infer<typeof llmOutputSchema>;

// API response schemas
export const chartSpecSchema = z.object({
  chartType: z.enum(['line', 'bar', 'area', 'pie', 'table', 'geo']),
  title: z.string(),
  mapping: z.object({
    x: z.string(),
    y: z.union([z.string(), z.array(z.string())]),
    series: z.string().nullable().optional(),
  }),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;

export const attemptSchema = z.object({
  step: z.number(),
  sql: z.string(),
  diagnostic: z.boolean(),
  sampleMeta: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export type Attempt = z.infer<typeof attemptSchema>;

export const successResponseSchema = z.object({
  prompt: z.string(),
  finalSql: z.string(),
  chartSpec: chartSpecSchema,
  rows: z.array(z.record(z.any())),
  tried: z.array(attemptSchema),
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;

export const errorResponseSchema = z.object({
  prompt: z.string(),
  error: z.string(),
  tried: z.array(attemptSchema),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Schema Investigation schemas
export const schemaInvestigationOutputSchema = z.object({
  thought: z.string(),
  queryType: z.enum(['explore_table', 'sample_values', 'count_rows', 'check_ranges', 'analyze_relationships']),
  sql: z.string(),
  explanation: z.string(),
  diagnostic: z.literal(true),
});

export type SchemaInvestigationOutput = z.infer<typeof schemaInvestigationOutputSchema>;

export const schemaInvestigationResultSchema = z.object({
  summary: z.string(),
  examplePrompts: z.array(z.string()),
  investigationSteps: z.array(attemptSchema),
});

export type SchemaInvestigationResult = z.infer<typeof schemaInvestigationResultSchema>;

// SQL Safety validation - minimal checks since database user is read-only
// 
// Security Philosophy:
// - Primary security is enforced by database-level permissions (analytics_ro user)
// - Application-level validation focuses on preventing injection patterns
// - No keyword blacklisting to avoid false positives (e.g., "CREATE" in "created_at")
//
const FORBIDDEN_PATTERNS = [
  /;/,            // Multiple statements (security risk for injection)
  /--/,           // SQL comments (could hide malicious code)
  /\/\*[\s\S]*?\*\//, // Multi-line comments (could hide malicious code)
];

export function validateSQL(sql: string): { isValid: boolean; error?: string } {
  // Clean the SQL more thoroughly
  let cleanedSql = sql.trim();
  
  // Remove any leading/trailing whitespace, newlines, and common formatting issues
  cleanedSql = cleanedSql.replace(/^\s+|\s+$/g, '');
  
  // Remove any leading comments or SQL artifacts that might be present
  cleanedSql = cleanedSql.replace(/^--.*$/gm, '').trim();
  cleanedSql = cleanedSql.replace(/^\/\*[\s\S]*?\*\//, '').trim();
  
  // Must start with SELECT (case insensitive)
  if (!cleanedSql.toUpperCase().startsWith('SELECT')) {
    console.log('SQL validation failed - does not start with SELECT:');
    console.log('Original SQL:', JSON.stringify(sql));
    console.log('Cleaned SQL:', JSON.stringify(cleanedSql));
    console.log('First 50 chars:', cleanedSql.substring(0, 50));
    return { isValid: false, error: 'SQL must start with SELECT' };
  }
  
  // Check for forbidden patterns (minimal security checks)
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(cleanedSql)) {
      return { isValid: false, error: `Forbidden pattern detected` };
    }
  }
  
  // Check for multiple statements (basic check)
  const statements = cleanedSql.split(';').filter(s => s.trim());
  if (statements.length > 1) {
    return { isValid: false, error: 'Multiple statements not allowed' };
  }
  
  return { isValid: true };
}

export function validateLLMOutput(output: any): { isValid: boolean; data?: LLMOutput; error?: string } {
  try {
    const validated = llmOutputSchema.parse(output);
    
    // Additional SQL validation
    const sqlValidation = validateSQL(validated.sql);
    if (!sqlValidation.isValid) {
      return { isValid: false, error: `SQL validation failed: ${sqlValidation.error}` };
    }
    
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: `Schema validation failed: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
}

export function validateSchemaInvestigationOutput(output: any): { isValid: boolean; data?: SchemaInvestigationOutput; error?: string } {
  try {
    const validated = schemaInvestigationOutputSchema.parse(output);
    
    // Additional SQL validation
    const sqlValidation = validateSQL(validated.sql);
    if (!sqlValidation.isValid) {
      return { isValid: false, error: `SQL validation failed: ${sqlValidation.error}` };
    }
    
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: `Schema validation failed: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
}
