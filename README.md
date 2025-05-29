# Notification System

Asynchronous event-based notification system with pipeline processing and message broker distribution.

## 🏗️ Architecture

The system consists of four main components:

### 1. Logic System (Trigger System)
- Responsible for pulling data from Anticapture DB
- Processes business logic to determine when notifications should be sent
- Implements conditional rules (if X happens, then send Y)
- Sends events to Message Broker when a notification should be generated

### 2. Message Broker
- Pub/sub queue system for asynchronous message management
- Manages the event queue between Logic System and Dispatcher
- Ensures unprocessed messages remain in the queue

### 3. Dispatcher
System responsible for managing and sending notifications:
- **Subscription Checker**: Verifies who should receive the notification (integration with Notification System DB)
- **Build Message**: Assembles the message payload
- **Send Message**: Sends the message to the Consumer

### 4. Consumer
- Responsible for presenting notifications to the user
- Ex: Telegram and Slack

## 🚀 Technologies

- TypeScript
- Turborepo (Monorepo)

## 📦 Monorepo Structure

```
apps/
  ├── trigger-system/   # Logic and rules system
  ├── dispatcher/       # Dispatch system
  ├── consumers/       # Message consumers
```

## 🛠️ Project Setup

1. Install dependencies:
```bash
pnpm install
```

2. Run in development mode:
```bash
pnpm dev
```

## 🐳 Running with Docker Compose

For production-like environment or to run all services together:

### Prerequisites
1. Copy the environment template:
```bash
cp env.example .env
```

2. Configure your environment variables in `.env`:
```bash
# Required: Telegram Bot Token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Required: Database URLs
SUBSCRIPTION_DATABASE_URL=postgresql://user:pass@host:port/db
ANTICAPTURE_DATABASE_URL=postgresql://user:pass@host:port/db
LOGIC_SYSTEM_DATABASE_URL=postgresql://user:pass@host:port/db

# Optional: Custom ports (defaults provided)
SUBSCRIPTION_SERVER_EXTERNAL_PORT=3001
CONSUMERS_EXTERNAL_PORT=3000
DISPATCHER_EXTERNAL_PORT=3002

# Optional: Logic System settings
TRIGGER_INTERVAL=60000
PROPOSAL_STATUS=active
```

### Running the Application
```bash
# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down
```

### Service URLs
- **Consumers API**: http://localhost:3000
- **Subscription Server**: http://localhost:3001  
- **Dispatcher**: http://localhost:3002
- **Logic System**: (worker service, no exposed port)

## 🔄 Processing Pipeline

1. Trigger System pulls data from Anticapture DB
2. Applies business rules and sends events to Message Broker
3. Message Broker keeps events in queue until consumed
4. Dispatcher consumes events and checks recipients in Notification System DB
5. Dispatcher builds and sends messages to Consumer
6. Consumer processes and displays notifications to users