import { Pool, QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __dashboardPool: Pool | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set for the dashboard app.');
}

const pool =
  global.__dashboardPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__dashboardPool = pool;
}

/**
 * Validates that a SQL query is read-only (SELECT only).
 * This ensures the dashboard never writes to the database.
 */
function validateReadOnlyQuery(sql: string): void {
  const normalized = sql.trim().toUpperCase();
  const readOnlyKeywords = ['SELECT', 'WITH'];
  const writeKeywords = [
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP',
    'TRUNCATE',
    'REPLACE',
    'MERGE',
    'GRANT',
    'REVOKE',
  ];

  // Check if query starts with a write operation
  for (const keyword of writeKeywords) {
    if (normalized.startsWith(keyword)) {
      throw new Error(
        `Dashboard is read-only. Write operations are not allowed. Attempted: ${keyword}`
      );
    }
  }

  // Ensure query starts with a read-only operation
  const isReadOnly = readOnlyKeywords.some((keyword) => normalized.startsWith(keyword));
  if (!isReadOnly) {
    throw new Error(
      `Dashboard is read-only. Only SELECT and WITH queries are allowed. Query: ${sql.substring(0, 50)}...`
    );
  }
}

/**
 * Execute a read-only database query.
 * This function enforces that only SELECT queries are executed.
 * The dashboard is designed to be read-only and never writes to the database.
 */
export async function query<T extends QueryResultRow>(
  text: string,
  values: Array<string | number> = []
): Promise<T[]> {
  validateReadOnlyQuery(text);
  const result = await pool.query<T>(text, values);
  return result.rows;
}
