# Subscription Server

Fastify REST API managing user subscriptions, notification deduplication, wallet tracking, and Slack OAuth. PostgreSQL persistence via Knex.js.

## API Overview

Swagger docs available at `/docs` when running.

### Key Endpoints

- `GET /subscriptions/:daoId` - Get DAO subscribers (supports `?proposal_timestamp=` for temporal filtering)
- `POST /subscriptions` - Create/update subscription
- `GET /notifications/should-send` - Deduplication check (batch variant available)
- `POST /notifications/mark-sent` - Record delivered notifications
- `GET /users/:userId/wallets` - Get user wallet addresses
- `POST /users/:userId/wallets` - Add wallet address
- `GET /health` - Health check
- `GET /slack/install` - Slack OAuth install redirect
- `GET /slack/oauth/callback` - Slack OAuth callback
- `GET /slack/workspace/:teamId/token` - Get encrypted workspace token

## Project Structure

```
src/
├── app.ts                      # Fastify setup, route registration
├── index.ts                    # Entry point
├── config/env.ts               # Zod-validated environment config
├── controllers/                # Route handlers (dao, notification)
├── services/                   # Business logic (subscription, notification)
├── repositories/               # Database access (user, preference, address, notification)
├── interfaces/                 # TypeScript interfaces for all layers
├── schemas/                    # Zod validation schemas for API input
├── mappers/                    # Domain entity -> API response mapping
└── routes/                     # Fastify route definitions with Swagger schemas
db/
└── migrations/                 # Knex.js migration files (*.ts)
```

## Database

PostgreSQL with Knex.js. Migrations in `db/migrations/`.

### Creating a New Migration

```bash
cd apps/subscription-server
npx knex migrate:make my_migration_name -x ts
```

### Key Tables

- `users` - `id`, `channel`, `channel_user_id`, `created_at`
- `user_preferences` - `user_id`, `dao_id`, `is_active`, `created_at`, `updated_at`
- `user_notifications` - Delivery tracking for deduplication
- `user_addresses` - `user_id`, `address`, `is_active`
- `channel_workspaces` - Slack workspace metadata
- `slack_workspaces` - Encrypted bot tokens (AES-256-CBC)

### Temporal Filtering

The `getDaoSubscribers` query accepts `proposal_timestamp` to only return users whose subscription `created_at` is before the event timestamp. This prevents "look-ahead" notifications.

### Deduplication

`shouldSend` / `shouldSendBatch` check `user_notifications` to filter out already-notified users. `markAsSent` records successful deliveries.

## Slack OAuth Flow

1. User visits `/slack/install` -> redirected to Slack OAuth consent screen
2. Slack redirects back to `/slack/oauth/callback` with auth code
3. Server exchanges code for bot token, encrypts with AES-256-CBC, stores in `slack_workspaces`
4. Consumer service fetches encrypted token via `/slack/workspace/:teamId/token`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: 3003) |
| `SLACK_CLIENT_ID` | No | Slack OAuth app client ID |
| `SLACK_CLIENT_SECRET` | No | Slack OAuth app client secret |
| `SLACK_REDIRECT_URI` | No | Slack OAuth redirect URI |
| `TOKEN_ENCRYPTION_KEY` | No | 64-char hex for AES-256-CBC token encryption |

## Testing

```bash
pnpm subscription-server test
```

Uses ts-jest. Tests co-located in `src/services/`. Prefer **stubs or fakes** for repository interfaces in unit tests (e.g. in-memory implementations) over mocks; we are moving toward stubs/fakes.
