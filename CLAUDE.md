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