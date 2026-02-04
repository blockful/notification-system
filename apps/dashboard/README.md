# Dashboard

A read-only dashboard for viewing notification system metrics.

## Read-Only Enforcement

**This dashboard is strictly read-only and never writes to the database.**

### Safety Measures

1. **Query Validation**: All database queries are validated to ensure only `SELECT` and `WITH` statements are executed
2. **API Routes**: All metrics API routes are `GET` requests only
3. **No Write Operations**: The codebase contains no `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, or other write operations

### Database Access

- The dashboard connects to the database using a read-only connection
- All queries go through the `query()` function in `src/lib/db.ts` which validates read-only operations
- Any attempt to execute a write operation will throw an error

### Authentication

- The dashboard uses cookie-based authentication (no database writes)
- Login credentials are validated against `DASHBOARD_SECRET` environment variable
- Authentication cookies are set in memory only

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (read-only access recommended)
- `DASHBOARD_SECRET` - Password for dashboard access
- `ENS_RPC_URL` - Optional ENS resolver RPC endpoint (mainnet)
