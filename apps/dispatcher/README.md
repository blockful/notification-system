# Dispatcher Service

The Dispatcher orchestrates notification delivery. It receives trigger events from the Logic System, processes them through trigger handlers, fetches subscription data, and forwards notifications to consumers.

## 🎯 Purpose

- **Message Routing**: Routes trigger events to appropriate handlers based on trigger ID
- **Subscription Management**: Fetches subscribers and applies filtering logic
- **Notification Orchestration**: Coordinates notification creation and delivery

## 🏗️ Service Flow

1. **Message Ingestion**: Consumes trigger events from `dispatcher-queue`
2. **Trigger Processing**: Routes messages to appropriate trigger handlers
3. **Subscriber Fetching**: Gets DAO subscribers from Subscription Server
4. **Notification Creation**: Builds notifications with proper formatting
5. **Message Publishing**: Forwards notifications to `consumer-queue`

## 📁 Project Structure

```
src/
├── app.ts                          # Main application and dependency injection
├── index.ts                        # Service entry point
├── envConfig.ts                     # Environment configuration with Zod
├── interfaces/
│   ├── dispatcher-message.interface.ts  # Message structure definitions
│   ├── base-trigger.interface.ts       # Trigger handler interfaces
│   ├── notification-client.interface.ts # Notification service interfaces
│   └── subscription-client.interface.ts # Subscription API interfaces
└── services/
    ├── rabbitmq-consumer.service.ts      # RabbitMQ message consumer
    ├── trigger-processor.service.ts      # Trigger routing and processing
    ├── subscription-client.service.ts    # Subscription Server API client
    ├── notification/
    │   ├── notification-factory.service.ts # Notification channel factory
    │   └── rabbitmq-notification.service.ts # RabbitMQ notification publisher
    └── triggers/
        ├── base-trigger.service.ts        # Abstract trigger handler
        └── new-proposal-trigger.service.ts # New proposal handler
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUBSCRIPTION_SERVER_URL` | ✅ | Base URL for Subscription Server API |
| `RABBITMQ_URL` | ✅ | RabbitMQ connection string |

### Example Configuration
```bash
SUBSCRIPTION_SERVER_URL=http://subscription-server:3001
RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
```

## 🚀 Running the Service

```bash
# Install dependencies
pnpm install
pnpm build

# Set environment variables
cp example.env .env
# Edit .env with your configuration

# Run in development mode
pnpm dev
```

## 🔄 Message Processing Architecture

### RabbitMQ Consumer
Consumes messages from `dispatcher-queue` and delegates processing:

```typescript
// Message structure received from Logic System
interface DispatcherMessage {
  triggerId: string;
  events: {
    id: string;
    daoId: string;
    description: string;
    timestamp: string;
  }[];
}
```

### Trigger Processor Service
Routes messages to appropriate handlers using registry pattern:

```typescript
interface TriggerHandler {
  handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult>;
}
```

**Supported Triggers:**
- `new-proposal`: Handles new governance proposal notifications

## 🎯 Trigger Handlers

### Base Trigger Handler
Abstract class providing common functionality:

**Key Features:**
- **Subscriber Filtering**: Gets DAO subscribers with temporal filtering
- **Deduplication**: Prevents duplicate notifications
- **Batch Processing**: Handles multiple events efficiently
- **Error Resilience**: Uses `Promise.allSettled` for delivery

### New Proposal Trigger Handler
Processes new governance proposal events:

**Message Format:**
```
🗳️ New governance proposal in {daoId}: "{proposalTitle}"
```

**Processing Steps:**
1. Extract proposal titles from descriptions
2. Fetch DAO subscribers with timestamp filtering
3. Remove users who already received notifications
4. Create and send notifications
5. Mark successful deliveries as sent

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test trigger-processor.service.test.ts
```
