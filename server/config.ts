import { z } from 'zod';

const configSchema = z.object({
  // Mistral AI Configuration
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default('mistral-large-latest'),
  
  // PostgreSQL Configuration
  PGHOST: z.string().default('localhost'),
  PGPORT: z.string().transform(Number).default('5432'),
  PGDATABASE: z.string().default('analytics'),
  PGUSER: z.string().default('analytics_ro'),
  PGPASSWORD: z.string().min(1, 'PGPASSWORD is required'),
  
  // Operational Configuration
  MAX_ATTEMPTS: z.string().transform(Number).default('3'),
  QUERY_TIMEOUT_MS: z.string().transform(Number).default('4000'),
  MAX_RESULT_ROWS: z.string().transform(Number).default('5000'),
  SCHEMA_CACHE_TTL_MS: z.string().transform(Number).default('60000'),
  
  // Schema Investigation Configuration
  MAX_SCHEMA_INVESTIGATION_STEPS: z.string().transform(Number).default('5'),
  ENABLE_SCHEMA_INVESTIGATION: z.string().transform(val => val === 'true').default('true'),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = configSchema.parse(process.env);
    return cachedConfig;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration. Please check your environment variables.');
  }
}

export function validateConfig(): void {
  getConfig();
}
