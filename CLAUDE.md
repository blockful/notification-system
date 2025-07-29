# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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