# Dashboard

Next.js 14 app providing read-only metrics and analytics for the notification system. Connects directly to the Subscription Server's PostgreSQL database.

## Key Characteristics

- **Read-only**: All database queries are validated to prevent write operations (INSERT, UPDATE, DELETE rejected at query level)
- **ISR caching**: API routes use 30-second revalidation for performance
- **Dark theme**: Custom Tailwind config with navy/blue palette
- **Authentication**: Simple password-based auth with SHA-256 hashed session cookie

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main dashboard page
│   ├── login/page.tsx              # Login page
│   ├── globals.css                 # Tailwind directives
│   └── api/
│       ├── auth/route.ts           # POST: password auth -> session cookie
│       └── metrics/
│           ├── summary/route.ts    # Total counts + distributions
│           ├── users/route.ts      # Paginated users table with filters
│           ├── daos/route.ts       # Top DAOs by subscriber count
│           ├── growth/route.ts     # Daily user growth (cumulative)
│           ├── notification-activity/route.ts  # Notifications per day
│           └── notifications-by-dao/route.ts   # Top DAOs by notification count
├── components/
│   ├── dashboard-client.tsx        # Main client component (orchestrates metrics)
│   ├── metric-card.tsx             # KPI display card
│   ├── tables/users-table.tsx      # Paginated users table with advanced filters
│   └── charts/                     # Recharts wrappers (line, bar, pie)
├── lib/
│   ├── db.ts                       # PostgreSQL pool with read-only validation
│   ├── auth.ts                     # SHA-256 session hashing
│   ├── metrics.ts                  # All database query builders
│   ├── ens.ts                      # ENS name resolution via ethfollow API
│   ├── metrics.test.ts             # Query builder tests
│   └── ens.test.ts                 # ENS resolution tests
└── middleware.ts                   # Auth middleware (cookie check)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (same as subscription-server) |
| `DASHBOARD_SECRET` | Yes | Plain text password for dashboard access |

## Commands

```bash
pnpm --filter @notification-system/dashboard dev    # Runs on port 3300
pnpm --filter @notification-system/dashboard build
pnpm --filter @notification-system/dashboard test   # Uses Node.js test runner (tsx --test)
```

## ENS Integration

Resolves Ethereum addresses to ENS names via ethfollow.xyz API. Uses in-memory LRU cache (2,000 entries, 5-minute TTL) with max 5 concurrent lookups.

## Tech Stack

- Next.js 14.2.5 (App Router)
- React 18, Recharts for charts
- Tailwind CSS 3.4 with custom dark theme
- PostgreSQL via `pg` (direct queries, no ORM)
- Node.js built-in `test` module for testing
