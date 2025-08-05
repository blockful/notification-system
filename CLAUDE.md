# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Repository Overview

This is an event-driven notification system for DAO governance built with microservices architecture. The system monitors blockchain proposals and delivers notifications via Telegram (with extensibility for other channels).

## Architecture

The system consists of 4 microservices connected via RabbitMQ:

1. **Logic System** - Monitors AntiCapture API for proposal events and triggers notifications
2. **Dispatcher** - Processes events, fetches subscribers, and creates notification messages
3. **Subscription Server** - REST API for managing user preferences and tracking notifications
4. **Consumer** - Telegram bot that delivers notifications and handles user interactions

## Key Commands

### Development
```bash
# Install dependencies (requires pnpm)
pnpm install

# Start all services with Docker Compose
pnpm dev

# Build all services
pnpm build

# Run tests across all services
pnpm test

# Format code
pnpm format
```

### Service-Specific Commands
```bash
# Run commands for specific services
pnpm logic-system <command>
pnpm dispatcher <command>
pnpm subscription-server <command>
pnpm consumer <command>

# Example: Run tests for logic-system
pnpm logic-system test

# Example: Start a single service in dev mode
pnpm logic-system dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for a specific service
pnpm --filter @notification-system/logic-system test

# Run a single test file
pnpm --filter @notification-system/logic-system test -- path/to/test.spec.ts
```

## Project Structure

```
apps/
├── logic-system/         # Event monitoring and triggering
├── dispatcher/           # Message processing and routing  
├── subscription-server/  # User preference API
├── consumers/           # Telegram bot delivery
└── integrated-tests/    # End-to-end testing

packages/
├── anticapture-client/  # GraphQL client for DAO data
└── rabbitmq-client/     # Shared RabbitMQ utilities
```

## Key Technologies

- **Runtime**: Node.js 18+, TypeScript 5.8.2
- **Frameworks**: Fastify (APIs), Express (legacy)
- **Database**: PostgreSQL with Knex.js migrations
- **Message Queue**: RabbitMQ for service communication
- **Testing**: Jest with ts-jest
- **Build**: Turbo monorepo with pnpm workspaces

## Message Flow

1. Logic System polls AntiCapture API every 30 seconds
2. On new proposals, sends `TriggerEvent` to dispatcher queue
3. Dispatcher fetches relevant subscribers and creates notifications
4. Consumer receives notifications and delivers via Telegram
5. Delivery status tracked in Subscription Server

## Database Schema

The Subscription Server manages:
- `users`: User profiles with Telegram/Discord IDs
- `daos`: DAO registry from AntiCapture
- `user_dao_subscriptions`: Many-to-many subscription relationships
- `user_notifications`: Notification delivery tracking for deduplication

## Environment Configuration

Each service requires specific environment variables:
- Copy `env.example` to `.env` at project root
- Key variables: `DATABASE_URL`, `RABBITMQ_URL`, `TELEGRAM_BOT_TOKEN`
- AntiCapture API endpoint configuration

## Testing Strategy

- Unit tests for business logic in each service
- Integration tests for API endpoints
- End-to-end tests in `integrated-tests` app
- Jest configuration in each service's `jest.config.js`

## Deployment

- GitHub Actions workflow in `.github/workflows/`
- Deploys to Railway on push to `dev` or `main`
- Path-based deployment triggers for specific services
- Docker Compose for local development mimics production
=======
## Project Overview

This is an event-driven notification system for DAO governance built with microservices architecture. The system monitors blockchain data for DAO proposals and delivers real-time notifications to users via Telegram. It uses RabbitMQ for message queuing and PostgreSQL for persistence.

## Architecture

The system consists of 4 main microservices:

1. **Logic System** (`apps/logic-system/`) - Monitors AntiCapture GraphQL API and triggers events
2. **Dispatcher** (`apps/dispatcher/`) - Processes trigger events and coordinates notification delivery  
3. **Subscription Server** (`apps/subscription-server/`) - REST API for user preferences and subscription management
4. **Consumer** (`apps/consumers/`) - Telegram bot and notification delivery service

## Development Commands

### Root Level Commands
- `pnpm dev` - Start all services with Docker Compose
- `pnpm build` - Build all apps using Turbo
- `pnpm test` - Run tests across all apps
- `pnpm format` - Format code with Prettier

### Per-Service Commands
Use the filter pattern to run commands in specific services:
- `pnpm --filter @notification-system/logic-system <command>`
- `pnpm --filter @notification-system/dispatcher <command>`
- `pnpm --filter @notification-system/subscription-server <command>`
- `pnpm --filter @notification-system/consumer <command>`

### Testing and Quality
- **Tests**: Each service uses Jest with TypeScript (`jest.config.js` or `jest.config.ts`)
- **Linting**: Logic system has ESLint configured (`pnpm logic-system lint`)
- **Type Checking**: Consumers service has type checking (`pnpm consumer check-types`)

## Message Flow Architecture

1. **Logic System** polls AntiCapture API → sends trigger events to RabbitMQ
2. **Dispatcher** consumes trigger events → fetches subscribers → creates notifications → publishes to Consumer queue
3. **Consumer** delivers notifications via Telegram → tracks delivery status in Subscription Server

## Key Implementation Patterns

### Trigger System
New trigger types follow this pattern:
- Extend base `Trigger` class in Logic System
- Implement `fetchData()` and `process()` methods
- Register in Logic System's `App` class
- Create corresponding handler in Dispatcher's trigger handlers
- Register handler in `TriggerProcessorService`

### RabbitMQ Integration
- Logic System publishes trigger events
- Dispatcher consumes trigger events and publishes notification events  
- Consumer consumes notification events for delivery

### Database Migrations
Subscription Server uses Knex.js for database operations with migrations in `db/migrations/`

## Technology Stack

- **Runtime**: Node.js 18+ with pnpm workspaces
- **Build Tool**: Turbo for monorepo builds
- **Messaging**: RabbitMQ with custom client abstractions
- **Database**: PostgreSQL with Knex.js migrations
- **API**: Fastify for REST endpoints
- **GraphQL**: Custom AntiCapture client in packages/
- **Testing**: Jest with ts-jest preset
- **Containerization**: Docker with multi-service compose

## Environment Requirements

Essential environment variables:
- `TELEGRAM_BOT_TOKEN` - Telegram bot authentication
- `ANTICAPTURE_GRAPHQL_ENDPOINT` - DAO data source
- `DATABASE_URL` - PostgreSQL connection
- `RABBITMQ_URL` - Message broker connection

## Extension Points

- **New Trigger Types**: Follow the pattern documented in `apps/logic-system/add-trigger-logic.md`
- **Notification Channels**: Add new delivery mechanisms in Consumer service
- **DAO Data Sources**: Extend AntiCapture client or add new data providers
