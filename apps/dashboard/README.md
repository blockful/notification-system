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

## Database Queries Guide

This section documents every database query used by the dashboard and the intent
behind each one. If the schema changes, use this to map the same business
meaning to the new model.

All queries live in `src/lib/metrics.ts` and are read-only.

### Summary Metrics

- Users total: `SELECT COUNT(*) FROM users`
  - Goal: total number of user records in the system.
- Active subscriptions total: `SELECT COUNT(*) FROM user_preferences WHERE is_active = true`
  - Goal: total active DAO subscriptions across all users.
- Active addresses total: `SELECT COUNT(*) FROM user_addresses WHERE is_active = true`
  - Goal: total active blockchain addresses linked to users.
- Notifications total: `SELECT COUNT(*) FROM notifications`
  - Goal: total notifications created (all time).

### Channel Distribution

- Query: `SELECT channel, COUNT(*) FROM users GROUP BY channel ORDER BY count DESC`
  - Goal: how many users exist per channel (e.g., slack, telegram, etc.).

### Engagement Distribution (addresses per user)

- Query built by `buildEngagementDistributionQuery()`
  - Goal: histogram of users grouped by number of active addresses.
  - Uses `user_addresses` grouped by `user_id` with `is_active = true`.

### User Growth (daily new users)

- Query: `SELECT date_trunc('day', created_at), COUNT(*) FROM users GROUP BY day ORDER BY day`
  - Goal: daily new user signups; turned into a cumulative series for charts.

### Top DAOs by active subscribers

- Query in `getTopDaos()`
  - Source: `user_preferences`
  - Filters: `is_active = true`, `dao_id` not null/empty, `TRIM(dao_id)`
  - Goal: highest subscriber counts per DAO.

### Notification Activity by Day

- Query built by `buildNotificationActivityByDayQuery(daoId?)`
  - Source: `notifications`
  - Optional filter: `dao_id = $1`
  - Goal: daily notification counts globally or for a specific DAO.

### Notification Activity by DAO

- Query in `buildNotificationActivityByDaoQuery(limit)`
  - Source: `notifications`
  - Aggregation: `COUNT(DISTINCT event_id)` grouped by trimmed `dao_id`
  - Goal: most active DAOs by number of distinct notification events.

### Users List + Filters (metrics table)

- Queries built by `buildUsersQueries()`
  - Base sources: `users`, `user_addresses`, `user_preferences`, `channel_workspaces`
  - Joins:
    - Addresses per user (active addresses + array of addresses)
    - DAO preferences per user (active dao count + array of dao_ids)
    - Slack workspace name via `channel_workspaces`
  - Filters:
    - DAO filter via `user_preferences` (active only)
    - Channel filter via `users.channel`
    - Address filter via `user_addresses.address` (active only)
    - Min/Max addresses via computed address_count
  - Goal: paginated list of users with derived metrics and filters for the UI.

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

