# AGENTS.md

> Project context for AI coding assistants. See [agents.md](https://agents.md) for the open standard.

## Architecture Overview

Event-driven notification system for DAO governance, built as a **pnpm monorepo** with 4 microservices connected via RabbitMQ:

1. **Logic System** (`apps/logic-system/`) - Polls AntiCapture GraphQL API every Xs, detects governance events, publishes trigger events
2. **Dispatcher** (`apps/dispatcher/`) - Consumes trigger events, fetches subscribers with temporal filtering, routes notifications
3. **Subscription Server** (`apps/subscription-server/`) - Fastify REST API for user preferences, PostgreSQL persistence, Slack OAuth
4. **Consumer** (`apps/consumers/`) - Delivers notifications via Telegram (telegraf) and Slack (@slack/bolt) bots

Supporting packages: `anticapture-client` (GraphQL), `messages` (templates), `rabbitmq-client` (AMQP wrapper).

Dashboard (`apps/dashboard/`) provides read-only metrics via Next.js.

## Essential Commands

```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Start all services with Docker Compose
pnpm build                      # Build all services (via Turbo)
pnpm test                       # Run all tests (via Turbo)

# Service-specific (filter shortcuts)
pnpm logic-system <cmd>         # e.g., pnpm logic-system test
pnpm dispatcher <cmd>
pnpm subscription-server <cmd>
pnpm consumer <cmd>

# Testing specific services/patterns
pnpm --filter @notification-system/logic-system test
pnpm --filter @notification-system/integrated-tests test -- --testNamePattern="voting"
NODE_ENV=test pnpm --filter @notification-system/integrated-tests test

# Type checking and linting
pnpm consumer check-types
pnpm logic-system lint

# GraphQL code generation (requires ANTICAPTURE_GRAPHQL_ENDPOINT)
pnpm client codegen
```

## Notification Pipeline

```
Logic System (polls API every 30s)
  -> publishes TriggerEvent to dispatcher-queue
    -> Dispatcher consumes, fetches subscribers with temporal filtering
      -> publishes NotificationPayload to notifications.exchange (topic)
        -> Consumer binds notifications.<channel>.* per platform
          -> delivers via Telegram/Slack -> marks as sent in Subscription Server
```

## Adding New Trigger Types

Step-by-step guide for agents and developers. Use the same **trigger id** (e.g. `my-trigger`) in Logic System and Dispatcher so routing works.

### 1. Logic System – detect event and publish

- **Create trigger** in `apps/logic-system/src/triggers/`: extend `Trigger<T>` (see `base-trigger.ts`), implement `fetchData()` and `process(data[], lastTimestamp?)`.
- **Optional:** If the trigger needs a dedicated data layer, add a repository in `apps/logic-system/src/repositories/` and use it from the trigger.
- **Register** the trigger in `App.setupTriggers()` in `apps/logic-system/src/app.ts`.

### 2. Dispatcher – handle event and route notifications

- **Create handler** in `apps/dispatcher/src/services/triggers/`: extend `BaseTriggerHandler`, use the same trigger id as in Logic System.
- **Register** the handler in `TriggerProcessorService` via `addHandler()` in `apps/dispatcher/src/app.ts`.

### 3. Messages – templates and buttons

- **Add message templates** in `packages/messages/src/triggers/` (e.g. `my-trigger.ts`) with `{{placeholder}}` syntax; export from `packages/messages/src/index.ts`.
- **Add buttons config** in `packages/messages/src/triggers/buttons.ts` if the notification needs CTAs (e.g. explorer links).

### 4. Unit tests

- **Logic System:** Add tests in `apps/logic-system/tests/` (e.g. next to or mirroring the trigger). Use **stubs or fakes** for the RabbitMQ dispatcher and repositories (preferred over mocks); assert `fetchData()`/`process()` behavior.
- **Dispatcher:** Add or extend co-located tests (e.g. `my-trigger.service.test.ts` in `apps/dispatcher/src/services/triggers/`). Use **stubs or fakes** for `ISubscriptionClient`, `INotificationClient`, and dependencies (preferred over mocks); assert handler logic and payload shape.
- **Messages:** Add tests in `packages/messages` for new templates (placeholder replacement, edge cases) if non-trivial.

### 5. Integration tests

- **Add or extend** tests in `apps/integrated-tests/`: cover the new trigger flow (Logic System → Dispatcher → Consumer) using real RabbitMQ (testcontainers), in-memory DB, and stubs/fakes (or mocks during transition) for Telegram/Slack. Run with `NODE_ENV=test` and optionally filter: `pnpm --filter @notification-system/integrated-tests test -- --testNamePattern="my-trigger"`.

### Checklist

| Step | Location | Action |
|------|----------|--------|
| 1a | Logic System `src/triggers/` | New class extending `Trigger<T>`, implement `fetchData()` and `process()` |
| 1b | Logic System `src/repositories/` | (Optional) New repository if trigger needs dedicated data access |
| 1c | Logic System `src/app.ts` | Register trigger in `App.setupTriggers()` |
| 2a | Dispatcher `src/services/triggers/` | New handler extending `BaseTriggerHandler` |
| 2b | Dispatcher `src/app.ts` | Register handler with `TriggerProcessorService.addHandler()` |
| 3a | Messages `src/triggers/` | New template file; export from `index.ts` |
| 3b | Messages `src/triggers/buttons.ts` | Add button config if trigger has CTAs |
| 4 | Logic System, Dispatcher, Messages | Add/update unit tests |
| 5 | `apps/integrated-tests/` | Add or extend integration test for the new trigger flow |

## Database Schema (Subscription Server)

Key tables:
- `users` - User profiles with `channel`, `channel_user_id`
- `user_preferences` - DAO subscriptions with `is_active`, `created_at` (temporal filtering)
- `user_notifications` - Delivery tracking for deduplication
- `user_addresses` - Wallet addresses for personalized notifications
- `channel_workspaces` - Slack workspace metadata
- `slack_workspaces` - Encrypted OAuth tokens (AES-256-CBC)

Migrations in `apps/subscription-server/db/migrations/` (Knex.js).

## Testing Strategies

**Unit tests:** Prefer **stubs and fakes** over mocks. The codebase still has many mocks; new tests and refactors should use stubs/fakes where possible (e.g. in-memory or fake implementations of interfaces) to improve maintainability and avoid over-coupling to implementation details.

**Integration tests** (`apps/integrated-tests/`): Uses `@testcontainers/rabbitmq` for real RabbitMQ, SQLite in-memory DB, and stubs/fakes (or temporary mocks) for Telegram/Slack. Run with `NODE_ENV=test`. Prefer stubs and fakes for external service boundaries as we migrate away from mocks.

**Dashboard tests:** Node.js built-in `test` module (`tsx --test`).

## Environment Configuration

Required `.env` variables:
```
DATABASE_URL=postgresql://user:pass@localhost/dbname
RABBITMQ_URL=amqp://localhost
ANTICAPTURE_GRAPHQL_ENDPOINT=https://...
TELEGRAM_BOT_TOKEN=...
SLACK_SIGNING_SECRET=...
TOKEN_ENCRYPTION_KEY=...  # 64-char hex for AES-256-CBC
```

## Code Conventions

- **Language:** TypeScript (strict mode) across all services
- **Validation:** Zod schemas for environment variables and API inputs
- **Monorepo:** pnpm workspaces + Turbo for builds
- **Testing:** Jest with ts-jest (most services), Node.js test runner (dashboard)
- **Package manager:** pnpm 10.x, Node.js >= 18

## Deployment

- GitHub Actions deploys to Railway on push to `dev` or `main`
- Path-based triggers for selective service deployment
- Docker Compose in `docker-compose.yml` for local development
- Each service has its own `Dockerfile`

## Manual Notification Testing (Database Inserts)

To test without real blockchain events, insert mock data into the AntiCapture API database. The Logic System polls this data and triggers notifications.

### Prerequisites
1. Identify the correct schema (check `information_schema.schemata`)
2. Find an active user in subscription-server with `is_active = true`
3. Get the user's wallet address from `user_addresses` table
4. Run the indexer locally (`pnpm serve`) or just use the onde deployed on dev. 

### Critical Notes
- **Always disable triggers before INSERT**: Tables have `live_query` triggers that fail on manual inserts
- **Use real `proposal_id`** for votes: Fake IDs cause API 500 errors
- **Prefix mock tx_hash with `0xmock`**: Makes cleanup easy
- **Use current timestamp**: `extract(epoch from now())::bigint` in SQL

### Vote Confirmation Insert
```sql
SET search_path TO "<schema_uuid>";
ALTER TABLE votes_onchain DISABLE TRIGGER ALL;

INSERT INTO votes_onchain (tx_hash, dao_id, voter_account_id, proposal_id, support, voting_power, reason, timestamp)
VALUES (
  '0xmock_vote_' || extract(epoch from now())::bigint,
  'ENS',
  '<user_wallet_address>',
  '<real_proposal_id_from_proposals_onchain>',
  '1',  -- 0=Against, 1=For, 2=Abstain
  1000000000000000000,
  'Mock vote for testing',
  extract(epoch from now())::bigint
);

ALTER TABLE votes_onchain ENABLE TRIGGER ALL;
```

### Voting Power Change Insert (Delegation Received)
```sql
SET search_path TO "<schema_uuid>";
ALTER TABLE voting_power_history DISABLE TRIGGER ALL;
ALTER TABLE delegations DISABLE TRIGGER ALL;

INSERT INTO voting_power_history (transaction_hash, dao_id, account_id, voting_power, delta, delta_mod, timestamp, log_index)
VALUES (
  '0xmock_vp_' || extract(epoch from now())::bigint,
  'ENS',
  '<user_wallet_address>',
  5000000000000000000,
  1000000000000000000,
  1000000000000000000,
  extract(epoch from now())::bigint,
  1
);

INSERT INTO delegations (transaction_hash, dao_id, delegate_account_id, delegator_account_id, delegated_value, previous_delegate, timestamp, log_index)
VALUES (
  '0xmock_vp_' || extract(epoch from now())::bigint,
  'ENS',
  '<user_wallet_address>',
  '0x1111111111111111111111111111111111111111',
  1000000000000000000,
  '0x0000000000000000000000000000000000000000',
  extract(epoch from now())::bigint,
  1
);

ALTER TABLE voting_power_history ENABLE TRIGGER ALL;
ALTER TABLE delegations ENABLE TRIGGER ALL;
```

### Cleanup Mock Data
```sql
SET search_path TO "<schema_uuid>";
ALTER TABLE votes_onchain DISABLE TRIGGER ALL;
ALTER TABLE voting_power_history DISABLE TRIGGER ALL;
ALTER TABLE delegations DISABLE TRIGGER ALL;

DELETE FROM votes_onchain WHERE tx_hash LIKE '0xmock%';
DELETE FROM voting_power_history WHERE transaction_hash LIKE '0xmock%';
DELETE FROM delegations WHERE transaction_hash LIKE '0xmock%';

ALTER TABLE votes_onchain ENABLE TRIGGER ALL;
ALTER TABLE voting_power_history ENABLE TRIGGER ALL;
ALTER TABLE delegations ENABLE TRIGGER ALL;
```

### Finding Test Data
```sql
-- Get real proposal IDs
SELECT id, LEFT(description, 50), status FROM proposals_onchain ORDER BY timestamp DESC LIMIT 5;

-- Check for orphan votes (will cause API 500)
SELECT v.* FROM votes_onchain v LEFT JOIN proposals_onchain p ON v.proposal_id = p.id WHERE p.id IS NULL;

-- List mock records
SELECT 'VOTE' as type, tx_hash, timestamp FROM votes_onchain WHERE tx_hash LIKE '0xmock%'
UNION ALL SELECT 'VP', transaction_hash, timestamp FROM voting_power_history WHERE transaction_hash LIKE '0xmock%'
UNION ALL SELECT 'DELEG', transaction_hash, timestamp FROM delegations WHERE transaction_hash LIKE '0xmock%';
```
