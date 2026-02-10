# Dispatcher

Consumes trigger events from the Logic System, fetches subscribers, applies deduplication and temporal filtering, then routes notifications to consumers via RabbitMQ topic exchange.

## How It Works

1. `RabbitMQConsumerService` consumes from `dispatcher-queue`
2. `TriggerProcessorService` routes messages to registered handlers by `triggerId`
3. Handlers extend `BaseTriggerHandler` which provides subscriber fetching and deduplication
4. Notifications are published to `notifications.exchange` with routing key `notifications.<channel>.<type>`

## Key Patterns

**Registry pattern**: `TriggerProcessorService` maps `triggerId -> TriggerHandler[]`. Supports multiple handlers per trigger (e.g., `proposal-finished` has both `ProposalFinishedTriggerHandler` and `NonVotingHandler`). Uses `Promise.allSettled` so one handler failure doesn't block others.

**Template method**: `BaseTriggerHandler` provides `getSubscribers()` (temporal filtering + deduplication) and `sendNotificationsToSubscribers()` (channel routing + mark-as-sent).

**Factory pattern**: `NotificationClientFactory` maps channel names to `INotificationClient` implementations.

## Implemented Handlers

| Handler | Trigger ID | Description |
|---------|-----------|-------------|
| `NewProposalTriggerHandler` | `new-proposal` | Proposal announcements |
| `VotingPowerTriggerHandler` | `voting-power-changed` | Delegation/balance changes |
| `ProposalFinishedTriggerHandler` | `proposal-finished` | Proposal outcome notifications |
| `VoteConfirmationTriggerHandler` | `vote-confirmation` | Vote submission confirmations |
| `VotingReminderTriggerHandler` | `voting-reminder` | Time-based voting reminders |
| `NonVotingHandler` | `proposal-finished` | Alerts about followed addresses not voting |

## Project Structure

```
src/
├── app.ts                         # Dependency injection, handler registration
├── index.ts                       # Entry point
├── envConfig.ts                   # Zod-validated environment config
├── interfaces/                    # TriggerHandler, INotificationClient, ISubscriptionClient, DispatcherMessage
├── services/
│   ├── rabbitmq-consumer.service.ts       # Consumes from dispatcher-queue
│   ├── trigger-processor.service.ts       # Registry + routing
│   ├── subscription-client.service.ts     # HTTP client for Subscription Server API
│   ├── batch-notification.service.ts      # Batch notification orchestration
│   ├── notification/
│   │   ├── notification-factory.service.ts    # Channel factory
│   │   └── rabbitmq-notification.service.ts   # Publishes to notifications.exchange
│   └── triggers/
│       ├── base-trigger.service.ts            # Abstract base with shared logic
│       ├── new-proposal-trigger.service.ts    # + co-located .test.ts
│       ├── voting-power-trigger.service.ts
│       ├── proposal-finished-trigger.service.ts
│       ├── vote-confirmation-trigger.service.ts
│       ├── voting-reminder-trigger.service.ts
│       ├── non-voting-handler.service.ts
│       └── non-voting-handler.test-factory.ts # Shared test data builders
└── lib/
    └── number-formatter.ts        # Token amount formatting
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUBSCRIPTION_SERVER_URL` | Yes | Base URL for Subscription Server API |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | Yes | AntiCapture GraphQL endpoint |

## Testing

```bash
pnpm dispatcher test
```

Tests are co-located with implementations (`.service.test.ts`). Uses test factories in `non-voting-handler.test-factory.ts` for reusable test data builders. Prefer **stubs or fakes** for dependencies (e.g. `ISubscriptionClient`, `INotificationClient`) over Jest mocks; we are moving toward stubs/fakes for better maintainability.
