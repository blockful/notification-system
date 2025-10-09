# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Changes

### Slack OAuth Multi-Workspace Support (2025-09-18)
- OAuth 2.0 flow implementation in Subscription Server (`/slack/install`, `/slack/oauth/callback`)
- Workspace token storage with AES-256-CBC encryption in `slack_workspaces` table
- Dynamic token distribution via RabbitMQ messages (bot_token field)
- Backward compatible with workspace:user ID format (T_DEFAULT for legacy)
- See `docs/slack-oauth-setup.md` for configuration guide

### Slack Integration (2025-09-17)
- Added Socket Mode support for interactive Slack features in Consumer service
- New service classes: SlackDAOService, SlackWalletService for command handling
- Session management using InMemorySessionStorage (consider Redis for production)
- Slack Block Kit UI implementation for rich interactive messages

### GraphQL Migration (2025-08-15)
- **IMPORTANT**: Currently reverting some changes - `proposals` query now returns `{ items: [], totalCount }` structure
- Native `title` field support (no longer extracted from description)
- Query parameters: `status`, `fromDate`, `skip`, `limit` replaced `where` filters
- Field `proposalsOnchain` renamed to `proposal` for single queries

## Architecture Overview

Event-driven notification system with 4 microservices connected via RabbitMQ:

1. **Logic System** (`apps/logic-system/`) - Monitors AntiCapture API, triggers events every 30 seconds
2. **Dispatcher** (`apps/dispatcher/`) - Processes events, fetches subscribers, creates notifications
3. **Subscription Server** (`apps/subscription-server/`) - REST API for user preferences, PostgreSQL persistence
4. **Consumer** (`apps/consumers/`) - Delivers notifications via Telegram/Slack bots

## Essential Commands

```bash
# Development
pnpm install                    # Install all dependencies
pnpm dev                        # Start all services with Docker Compose
pnpm build                      # Build all services
pnpm test                       # Run all tests

# Service-specific shortcuts
pnpm logic-system <cmd>         # Run commands in logic-system
pnpm dispatcher <cmd>           # Run commands in dispatcher
pnpm subscription-server <cmd>  # Run commands in subscription-server
pnpm consumer <cmd>             # Run commands in consumer

# Testing patterns
pnpm --filter @notification-system/logic-system test
pnpm --filter @notification-system/integrated-tests test -- --testNamePattern="voting"
NODE_ENV=test pnpm --filter @notification-system/integrated-tests test

# Type checking and linting
pnpm consumer check-types
pnpm logic-system lint

# GraphQL code generation
pnpm client codegen
ANTICAPTURE_GRAPHQL_ENDPOINT="https://api-gateway-production-0879.up.railway.app/graphql" pnpm client codegen
```

## Message Flow Patterns

### Notification Pipeline
1. Logic System polls AntiCapture API → publishes `TriggerEvent` to RabbitMQ
2. Dispatcher consumes trigger → fetches subscribers with temporal filtering → publishes notifications
3. Consumer delivers via Telegram/Slack → tracks delivery in Subscription Server

### Adding New Trigger Types
1. Extend base `Trigger` class in `apps/logic-system/src/triggers/`
2. Implement `fetchData()` and `process()` methods
3. Register in `App.setupTriggers()` in Logic System
4. Create handler in `apps/dispatcher/src/trigger-handlers/`
5. Register handler in `TriggerProcessorService`

## Service Architectures

### Consumer Service (Telegram/Slack Bot)
- **Telegram**: Uses telegraf with session management via telegraf-session-local
- **Slack**: Uses @slack/bolt with Socket Mode for interactive features
- **Pattern**: Service classes (TelegramBotService, SlackBotService) implement BotServiceInterface
- **Session Storage**: InMemorySessionStorage for Slack (needs Redis for production scale)

### Subscription Server API
- **Framework**: Fastify with Swagger documentation
- **Database**: PostgreSQL with Knex.js migrations in `db/migrations/`
- **Deduplication**: Tracks notifications in `user_notifications` table
- **Temporal Filtering**: Only notifies users subscribed before event timestamp

### Logic System Triggers
- **Base Class**: `Trigger` abstract class with `fetchData()` and `process()` lifecycle
- **Polling**: 30-second intervals configured per trigger
- **State Management**: Tracks last processed items to avoid duplicates

## Database Schema

Key tables in Subscription Server:
- `users`: User profiles with platform-specific IDs (telegram_id, slack_id)
- `user_dao_subscriptions`: Many-to-many subscriptions with created_at for temporal filtering
- `user_notifications`: Delivery tracking for deduplication
- `user_wallets`: Wallet addresses for personalized notifications

## Testing Strategies

### Unit Tests
- Mock RabbitMQ connections with `jest.mock('@notification-system/rabbitmq-client')`
- Mock GraphQL responses in `integrated-tests/src/mocks/graphql-mock-setup.ts`

### Integration Tests
- Test helpers in `integrated-tests/src/helpers/` for each platform
- Use `waitForMessage()` pattern for async message verification
- Environment: `NODE_ENV=test` for test database isolation

### End-to-End Tests
- Full service orchestration tests in `apps/integrated-tests/tests/`
- Docker Compose setup mimics production environment

## Environment Configuration

Required variables in `.env`:
```
DATABASE_URL=postgresql://user:pass@localhost/dbname
RABBITMQ_URL=amqp://localhost
TELEGRAM_BOT_TOKEN=your_bot_token
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_APP_TOKEN=xapp-your-app-token  # For Socket Mode
SLACK_SIGNING_SECRET=your-signing-secret
ANTICAPTURE_GRAPHQL_ENDPOINT=https://api-gateway-production-0879.up.railway.app/graphql
```

## Deployment

- GitHub Actions deploys to Railway on push to `dev` or `main`
- Path-based triggers for selective service deployment
- Docker Compose configuration in `docker-compose.yml` for local development