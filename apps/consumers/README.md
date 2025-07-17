# Consumer Service

The Consumer Service is the final delivery layer for notifications, providing a Telegram bot interface for user interactions and consuming notifications from RabbitMQ for delivery to users.

## 🎯 Purpose

- **Notification Delivery**: Receive and deliver notifications to Telegram users
- **User Interface**: Telegram bot for managing DAO subscription preferences
- **Session Management**: Handle user interactions and maintain state
- **Subscription Management**: Allow users to subscribe/unsubscribe from DAO notifications

## 🏗️ Service Flow

1. **Bot Interactions**: Users interact with Telegram bot to manage preferences
2. **Message Consumption**: Consume notifications from `consumer-queue` via RabbitMQ
3. **Notification Delivery**: Send notifications to subscribed Telegram users
4. **Preference Management**: Sync user preferences with Subscription Server

## 📁 Project Structure

```
src/
├── app.ts                                    # Main application and service orchestration
├── index.ts                                  # Service entry point
├── messages.ts                               # Bot message templates and responses
├── config/
│   ├── env.ts                               # Environment configuration with Zod
│   └── knownCommands.ts                     # Bot command definitions
└── services/
    ├── telegram-bot.service.ts              # Telegram bot implementation
    ├── rabbitmq-notification-consumer.service.ts # RabbitMQ message consumer
    ├── dao.service.ts                       # DAO preference management
    └── subscription-api.service.ts          # Subscription Server API client
```

## 🤖 Telegram Bot Features

### Commands
- `/start` - Initialize bot and show welcome message
- `/daos` - Manage DAO notification preferences
- `/learn_more` - Learn about Anticapture platform

### Interactive Features
- **Persistent Keyboard**: Always-available buttons ("🌐 DAOs", "💡 Learn More")
- **Inline Keyboards**: Dynamic DAO selection with checkboxes
- **Session State**: Temporary selections preserved during interaction
- **Emoji Support**: Visual indicators for different DAOs (🦄 UNI, 🔷 ENS)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram bot authentication token |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | ✅ | GraphQL API endpoint for DAO data |
| `SUBSCRIPTION_SERVER_URL` | ✅ | Subscription management API URL |
| `RABBITMQ_URL` | ✅ | RabbitMQ connection string |

### Example Configuration
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
ANTICAPTURE_GRAPHQL_ENDPOINT=https://api.anticapture.xyz/graphql
SUBSCRIPTION_SERVER_URL=http://subscription-server:3001
RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
```

## 🚀 Running the Service

### Local Development
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

## 📨 Message Processing

### RabbitMQ Consumer
Consumes notifications from `consumer-queue`:

```typescript
// Expected message structure
{
  type: 'NOTIFICATION_EVENT',
  payload: {
    userId: string,
    channelUserId: number,
    message: string
  }
}
```

### Notification Delivery
```typescript
// Example notification
"🗳️ New governance proposal in UNI: 'Uniswap Protocol Governance'"
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test telegram-bot.service.test.ts
```
