# Subscription Server

The Subscription Server is a **REST API service** that manages user subscriptions to DAO notifications. Built with Fastify and PostgreSQL, it serves as the central hub for subscription management and notification deduplication.

## 🎯 Purpose

- **Subscription Management**: Handle user subscriptions to DAO notifications
- **Deduplication**: Prevent duplicate notifications through tracking
- **Multi-Channel Support**: Support Telegram, Discord, and other notification channels

## 🏗️ Service Flow

1. **Subscription Creation**: Users subscribe/unsubscribe to DAO notifications
2. **Subscriber Queries**: Dispatcher fetches active subscribers for events
3. **Deduplication**: Filter out notifications already sent to users
4. **Delivery Tracking**: Mark notifications as sent to prevent duplicates

## 📁 Project Structure

```
src/
├── app.ts                          # Main Fastify application setup
├── index.ts                        # Service entry point
├── config.ts                       # Database configuration and environment
├── controllers/
│   ├── dao.controller.ts           # Subscription endpoints
│   ├── notification.controller.ts  # Notification tracking endpoints
│   └── initial_routes.ts           # Health check routes
├── services/
│   ├── subscription.service.ts     # Subscription business logic
│   └── notification.service.ts     # Notification deduplication logic
├── repositories/
│   └── knex.repository.ts          # Database access layer
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `PORT` | ❌ | `3000` | Server port |

### Example Configuration
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/notifications
PORT=3001
```

## 🚀 Local Development

```bash
# Install dependencies
pnpm install
pnpm build

# Run in development mode
pnpm dev
```

## 🔌 API Endpoints

### Subscription Management

#### Create/Update Subscription
```http
POST /subscriptions/:dao
Content-Type: application/json

{
  "channel": "telegram",
  "channel_user_id": "123456789",
  "is_active": true
}
```

**Response:**
```json
{
  "user_id": "uuid-v4",
  "dao_id": "dao-name",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Get DAO Subscribers
```http
GET /subscriptions/:dao?proposal_timestamp=1705312200000
```

**Response:**
```json
[
  {
    "id": "uuid-v4",
    "channel": "telegram",
    "channel_user_id": "123456789",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Notification Deduplication

#### Filter Sent Notifications
```http
POST /notifications/exclude-sent
Content-Type: application/json

[
  {
    "user_id": "uuid-v4",
    "dao_id": "dao-name",
    "event_id": "event-123"
  }
]
```

**Response:** Array of notifications that should be sent (not already sent)

#### Mark Notifications as Sent
```http
POST /notifications/mark-sent
Content-Type: application/json

[
  {
    "user_id": "uuid-v4",
    "dao_id": "dao-name",
    "event_id": "event-123"
  }
]
```

**Response:** `204 No Content`

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔍 Key Features

### Temporal Filtering
Filter subscribers based on when they subscribed:

```typescript
// Only get users who subscribed before the proposal timestamp
const subscribers = await subscriptionService.getDaoSubscribers(
  'dao-name', 
  1705312200000 // Unix timestamp in milliseconds
);
```

### Deduplication Logic
Prevent duplicate notifications:

```typescript
// Check which notifications haven't been sent yet
const notificationsToSend = await notificationService.getShouldSendNotifications(
  allNotifications
);

// Mark notifications as sent after successful delivery
await notificationService.markNotificationsAsSent(sentNotifications);
```

### Multi-Channel Support
Support different notification channels:

```typescript
// Telegram user
{ channel: 'telegram', channel_user_id: '123456789' }

// Discord user (future)
{ channel: 'discord', channel_user_id: 'user#1234' }
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test subscription.service.test.ts
```

## 🔍 API Documentation

The service provides interactive API documentation via Swagger:

- **Development**: `http://localhost:3001/docs`
