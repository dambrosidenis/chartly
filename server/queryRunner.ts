import { Pool, PoolClient } from 'pg';
import { getConfig } from './config';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const config = getConfig();
    pool = new Pool({
      host: config.PGHOST,
      port: config.PGPORT,
      database: config.PGDATABASE,
      user: config.PGUSER,
      password: config.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
}

export interface QueryError {
  message: string;
  code?: string;
  detail?: string;
}

export async function executeQuery(
  sql: string, 
  options: { 
    timeout?: number; 
    maxRows?: number; 
    isDiagnostic?: boolean 
  } = {}
): Promise<{ success: true; result: QueryResult } | { success: false; error: QueryError }> {
  const config = getConfig();
  const timeout = options.timeout || config.QUERY_TIMEOUT_MS;
  const maxRows = options.maxRows || config.MAX_RESULT_ROWS;
  const isDiagnostic = options.isDiagnostic || false;
  
  let client: PoolClient | null = null;
  
  try {
    const pool = getPool();
    client = await pool.connect();
    
    // Set session configuration
    await client.query('SET search_path = public');
    await client.query(`SET statement_timeout = ${timeout}`);
    
    // Apply row limit if needed
    let finalSql = sql.trim();
    
    // Check if query already has a LIMIT clause
    const hasLimit = /\bLIMIT\s+\d+\b/i.test(finalSql);
    
    if (!hasLimit) {
      const effectiveLimit = isDiagnostic ? Math.min(100, maxRows) : maxRows;
      // Wrap in subquery to apply LIMIT
      finalSql = `SELECT * FROM (${finalSql}) sub LIMIT ${effectiveLimit}`;
    }
    
    console.log(`Executing SQL (diagnostic: ${isDiagnostic}):`, finalSql.substring(0, 200) + (finalSql.length > 200 ? '...' : ''));
    
    const result = await client.query(finalSql);
    
    return {
      success: true,
      result: {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      }
    };
    
  } catch (error: any) {
    console.error('Query execution error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
    });
    
    return {
      success: false,
      error: {
        message: error.message || 'Unknown database error',
        code: error.code,
        detail: error.detail,
      }
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
