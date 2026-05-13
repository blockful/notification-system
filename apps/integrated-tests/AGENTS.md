# Integrated Tests

End-to-end tests for the full notification pipeline. Starts all 4 services with real RabbitMQ (via testcontainers) and SQLite in-memory database.

## Running Tests

```bash
NODE_ENV=test pnpm --filter @notification-system/integrated-tests test

# Run specific test pattern
pnpm --filter @notification-system/integrated-tests test -- --testNamePattern="voting"
```

## Test Lifecycle

1. **Global setup** (`src/setup/jest/jest-global-setup.ts`): Starts `@testcontainers/rabbitmq` container, stores URL in `process.env.TEST_RABBITMQ_URL`
2. **Suite setup** (`jest-setup-after-env.ts` `beforeAll`): Runs DB migrations (SQLite), creates default Slack workspace, starts all 4 apps, sets up GraphQL responses (stubs/fakes or HTTP mocks; we prefer stubs/fakes where applicable)
3. **Between tests** (`TestCleanup.cleanupBetweenTests()`): Clears test doubles / mocks, purges queues, resets trigger timestamps, cleans DB tables
4. **Suite teardown** (`afterAll`): Stops all apps, closes DB
5. **Global teardown** (`jest-global-teardown.ts`): Stops RabbitMQ container

## Test Organization

```
tests/
├── core/                           # Platform-agnostic behavior tests
│   ├── duplicate-prevention.test.ts
│   ├── temporal-filtering.test.ts
│   ├── multi-dao-notifications.test.ts
│   ├── address-normalization.test.ts
│   └── inactive-preference-handling.test.ts
├── telegram/                       # Telegram-specific trigger tests
│   ├── vote-confirmation-trigger.test.ts
│   ├── voting-power-trigger.test.ts
│   └── ...
└── slack/                          # Slack-specific trigger tests
    ├── slack-new-proposal.test.ts
    ├── vote-confirmation-trigger.test.ts
    └── ...
```

## Infrastructure

```
src/
├── config/                         # Constants, env vars, service config, timeouts
├── fixtures/factories/             # UserFactory, ProposalFactory, VoteFactory, VotingPowerFactory, WorkspaceFactory
├── helpers/
│   ├── database/                   # DatabaseTestHelper (waitForNotificationRecord), DatabaseCleanup
│   ├── messaging/                  # TelegramTestHelper, SlackTestHelper, EventCollector
│   └── utilities/                  # TestCleanup, waitFor (async polling)
├── setup/
│   ├── database/                   # SQLite Knex config + migration runner
│   ├── vitest/                     # Global setup/teardown + suite hooks
│   ├── services/                   # App startup logic for all 4 services
│   ├── msw-server.ts              # MSW setupServer + default kubb handlers + nonVotersResolver helper
│   └── rabbitmq-setup.ts          # Singleton RabbitMQ container manager
└── test-clients/                   # SimpleTelegramClient / SimpleSlackClient — implements consumer interfaces, records calls in-memory
```

## Typical Test Pattern

```typescript
import { proposalsHandler } from '@anticapture/client/msw';
import { server } from '../src/setup/msw-server';

it('should send notification for new proposal', async () => {
  const apps = TestCleanup.getGlobalApps();

  // 1. Create test data via factories
  await UserFactory.createWithSubscription({ channel: 'telegram', daoId: 'ENS' });

  // 2. Override the relevant kubb MSW handler with the test's data.
  //    Defaults in `msw-server.ts` return empty envelopes for every endpoint,
  //    so tests only need to override what they exercise. The kubb handler
  //    accepts the full `{ items, totalCount }` envelope shape.
  server.use(proposalsHandler({ items: [proposal], totalCount: 1 }));

  // 3. Wait for notification delivery
  const messages = await TelegramTestHelper.waitForMessage(mockSendMessage);

  // 4. Assert
  expect(messages[0].text).toContain('New governance proposal');
});
```

For endpoints that filter on query params (e.g., non-voter lookup that filters by `addresses[]`), pass a resolver instead of a static envelope. Use the shared `nonVotersResolver` helper from `src/setup/msw-server.ts`:

```typescript
import { proposalNonVotersHandler } from '@anticapture/client/msw';
import { server, nonVotersResolver } from '../../src/setup/msw-server';

server.use(proposalNonVotersHandler(nonVotersResolver(votes)));
```

## Jest Configuration

- `testTimeout`: 120,000ms (2 minutes)
- `maxWorkers`: 1 (sequential - shared RabbitMQ container)
- `forceExit`: true
- `silent`: true, `verbose`: true

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_RABBITMQ_URL` | Auto | Set by global setup from testcontainers |
| `SEND_REAL_TELEGRAM` | No | Set `true` to test with real Telegram bot |
| `SEND_REAL_SLACK` | No | Set `true` to test with real Slack bot |
| `TOKEN_ENCRYPTION_KEY` | No | Default test key provided |
