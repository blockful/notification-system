# @notification-system/rabbitmq-client

Shared RabbitMQ client for message broker communication in the notification system.

## Features

- **Simple Connection Management**: Basic connect/disconnect functionality
- **Publisher**: Direct message publishing to queues
- **Consumer**: Message consumption with automatic ACK/NACK
- **TypeScript**: Full type safety for messages

## Installation

```bash
pnpm install @notification-system/rabbitmq-client
```

## Usage

### Basic Setup

```typescript
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';

// Create and connect
const connection = new RabbitMQConnection('amqp://localhost:5672');
await connection.connect();
```

### Publishing Messages

```typescript
import { RabbitMQPublisher } from '@notification-system/rabbitmq-client';

const publisher = await RabbitMQPublisher.create(connection);

await publisher.publish('dispatcher-queue', {
  type: 'NEW_PROPOSAL',
  payload: {
    daoId: 'dao-123',
    proposalId: 'proposal-456'
  }
});

await publisher.close();
```

### Consuming Messages

```typescript
import { RabbitMQConsumer } from '@notification-system/rabbitmq-client';

const consumer = await RabbitMQConsumer.create(connection, 'dispatcher-queue');

await consumer.consume(async (message) => {
  console.log('Processing:', message.payload);
  // Message is automatically acknowledged on success
  // or rejected on error
});

// Consumer runs indefinitely, close when needed
await consumer.close();
```

## Message Format

All messages follow this structure:

```typescript
interface RabbitMQMessage<T = any> {
  id: string;          // Auto-generated UUID
  timestamp: string;   // Auto-generated ISO timestamp
  type: string;        // Message type (e.g., 'NEW_PROPOSAL')
  payload: T;          // Your data
}
```

## Configuration

### Environment Variables

- `RABBITMQ_URL`: Connection URL (default: amqp://localhost:5672)

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Clean
pnpm clean
```