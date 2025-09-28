import { executeQuery } from './queryRunner';
import { getConfig } from './config';

interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  columnName: string;
  dataType: string;
}

interface SchemaCache {
  summary: string;
  timestamp: number;
}

let schemaCache: SchemaCache | null = null;

export async function getSchemaInfo(): Promise<TableInfo[]> {
  // Get all tables in public schema
  const tablesResult = await executeQuery(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE' 
    ORDER BY table_name
  `);
  
  if (!tablesResult.success) {
    throw new Error(`Failed to fetch tables: ${tablesResult.error.message}`);
  }
  
  const tables: TableInfo[] = [];
  
  for (const tableRow of tablesResult.result.rows) {
    const tableName = tableRow.table_name;
    
    // Get columns for this table
    const columnsResult = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}' 
      ORDER BY ordinal_position
    `, { maxRows: 1000 });
    
    if (columnsResult.success) {
      const columns: ColumnInfo[] = columnsResult.result.rows.map(row => ({
        columnName: row.column_name,
        dataType: row.data_type,
      }));
      
      tables.push({
        tableName,
        columns,
      });
    }
  }
  
  return tables;
}

export async function buildCompactSchemaSummary(): Promise<string> {
  const tables = await getSchemaInfo();
  
  if (tables.length === 0) {
    return 'No tables found in public schema.';
  }
  
  const lines: string[] = [];
  
  for (const table of tables) {
    const columnSpecs = table.columns.map(col => 
      `${col.columnName} ${col.dataType}`
    ).join(', ');
    
    lines.push(`${table.tableName}(${columnSpecs})`);
  }
  
  // Add some sample data for small categorical columns if schema is small
  if (tables.length <= 3) {
    for (const table of tables) {
      for (const column of table.columns) {
        // Only sample text/varchar columns that might be categorical
        if (column.dataType.includes('text') || column.dataType.includes('varchar')) {
          try {
            const sampleResult = await executeQuery(`
              SELECT DISTINCT ${column.columnName} 
              FROM ${table.tableName} 
              WHERE ${column.columnName} IS NOT NULL 
              LIMIT 5
            `, { maxRows: 5, isDiagnostic: true });
            
            if (sampleResult.success && sampleResult.result.rows.length > 0 && sampleResult.result.rows.length <= 3) {
              const values = sampleResult.result.rows.map(row => row[column.columnName]).join(', ');
              lines.push(`  ${table.tableName}.${column.columnName} examples: ${values}`);
            }
          } catch (error) {
            // Ignore sampling errors
          }
        }
      }
    }
  }
  
  return lines.join('\n');
}

export async function getCachedSchemaSummary(): Promise<string> {
  const config = getConfig();
  const now = Date.now();
  
  // Check if cache is valid
  if (schemaCache && (now - schemaCache.timestamp) < config.SCHEMA_CACHE_TTL_MS) {
    return schemaCache.summary;
  }
  
  // Rebuild cache
  console.log('Rebuilding schema cache...');
  const summary = await buildCompactSchemaSummary();
  
  schemaCache = {
    summary,
    timestamp: now,
  };
  
  return summary;
}

export function clearSchemaCache(): void {
  schemaCache = null;
}
