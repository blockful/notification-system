# Logic System Service

The Logic System is the **business logic orchestrator** and first layer of the notification pipeline. It monitors blockchain data and triggers notification events when specific conditions are met.

## 🎯 Purpose

- **Data Monitoring**: Continuously polls AntiCapture GraphQL API for blockchain proposals
- **Business Logic**: Applies filtering and processing rules to determine when notifications should be sent
- **Message Routing**: Forwards trigger events to the Dispatcher service via RabbitMQ

## 🏗️ Service Flow

1. **Startup**: App initializes triggers with configuration
2. **Polling**: Triggers periodically fetch proposal data
3. **Processing**: Business logic filters and processes proposals
4. **Publishing**: Relevant events are sent to RabbitMQ
5. **Forwarding**: Dispatcher receives and routes messages

## 📁 Project Structure

```
src/
├── app.ts                     # Main application class and dependency injection
├── index.ts                   # Service entry point and bootstrap
├── repositories/
│   └── proposal.repository.ts # Data access layer for proposals
├── triggers/
│   ├── base-trigger.ts       # Abstract trigger base class
│   └── new-proposal-trigger.ts # New proposal monitoring trigger
└── api-clients/
    └── rabbitmq-dispatcher.service.ts # RabbitMQ integration
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | ✅ | - | GraphQL API endpoint URL |
| `RABBITMQ_URL` | ✅ | - | RabbitMQ connection string |
| `PROPOSAL_STATUS` | ✅ | - | Proposal status to monitor |
| `TRIGGER_INTERVAL` | ❌ | `60000` | Execution interval in milliseconds |

### Valid Proposal Statuses
- `pending`, `active`, `succeeded`, `defeated`
- `executed`, `canceled`, `queued`, `expired`

### Example Configuration
```bash
ANTICAPTURE_GRAPHQL_ENDPOINT=https://api.anticapture.xyz/graphql
RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
PROPOSAL_STATUS=pending
TRIGGER_INTERVAL=30000
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

## 🔄 Trigger System

### Base Trigger Class

The `BaseTrigger<TData, TFilterOptions>` provides the foundation for all triggers:

```typescript
abstract class Trigger<TData, TFilterOptions> {
  protected abstract fetchData(filterOptions?: TFilterOptions): Promise<TData[]>;
  protected abstract process(data: TData[]): Promise<void>;
  
  start(): void;
  stop(): void;
  restart(): void;
}
```

**Key Features:**
- **Generic Design**: Type-safe data handling
- **Interval-based**: Configurable execution frequency
- **Lifecycle Management**: Start/stop/restart functionality
- **Error Handling**: Automatic stop on persistent errors

### New Proposal Trigger

Monitors proposals with specific status and forwards them to the Dispatcher:

```typescript
class NewProposalTrigger extends Trigger<ProposalOnChain, { status: string }> {
  constructor(
    private proposalDataSource: ProposalDataSource,
    private dispatcherService: DispatcherService,
    interval: number
  );
}
```

**Behavior:**
- Polls for proposals every `TRIGGER_INTERVAL` milliseconds
- Filters by `PROPOSAL_STATUS` environment variable
- Supports case-insensitive status matching
- Forwards matching proposals to Dispatcher

## 📊 Data Access

### Proposal Repository

Implements the `ProposalDataSource` interface for blockchain data access:

```typescript
interface ProposalDataSource {
  getById(id: string): Promise<ProposalOrNull>;
  listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]>;
}
```

**Features:**
- **GraphQL Integration**: Type-safe queries to AntiCapture API
- **Multi-DAO Support**: Queries all DAOs when no specific DAO is set
- **Status Normalization**: Handles case variations (`pending`, `PENDING`, `Pending`)
- **Filtering**: Supports status and DAO ID filtering

### AntiCapture Client Integration

- **Type Safety**: Auto-generated GraphQL types
- **Header Management**: Handles `anticapture-dao-id` for DAO-specific queries
- **Error Handling**: Proper GraphQL error processing
- **Pagination**: Supports limit/offset parameters

## 📨 Message Publishing

### RabbitMQ Dispatcher Service

Publishes trigger events to the `dispatcher-queue`:

```typescript
interface DispatcherMessage {
  triggerId: string;
  events: ProposalOnChain[];
}
```

**Message Structure:**
```json
{
  "id": "uuid-v4",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "TRIGGER_EVENT",
  "payload": {
    "triggerId": "new-proposal",
    "events": [
      {
        "id": "proposal-123",
        "title": "Proposal Title",
        "status": "pending",
        "dao": { "id": "dao-456", "name": "DAO Name" }
      }
    ]
  }
}
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test new-proposal-trigger.test.ts
```