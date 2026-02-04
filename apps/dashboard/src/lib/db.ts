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

export async function query<T extends QueryResultRow>(text: string, values: Array<string | number> = []): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}
