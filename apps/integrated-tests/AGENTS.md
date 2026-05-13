# Integrated Tests

End-to-end tests for the full notification pipeline. Starts all 4 services with real RabbitMQ (via testcontainers) and SQLite in-memory database. Test runner: **vitest**. External HTTP intercepted by **MSW**. Telegram/Slack are in-process `Simple*` doubles that record calls in-memory.

## Running Tests

```bash
NODE_ENV=test pnpm --filter @notification-system/integrated-tests test

# Run tests whose name matches a pattern
pnpm --filter @notification-system/integrated-tests test -- -t "voting"
```

## Test Lifecycle

1. **Global setup** (`src/setup/vitest/global-setup.ts`): Starts `@testcontainers/rabbitmq` container, stores URL in `process.env.TEST_RABBITMQ_URL`
2. **Suite setup** (`src/setup/vitest/setup.ts` `beforeAll`): `server.listen()` for MSW, runs DB migrations (SQLite), creates default Slack workspace, starts all 4 apps wired with `SimpleTelegramClient` / `SimpleSlackClient`, exposes them on `global.telegramClient` / `global.slackClient`
3. **Between tests** (`TestCleanup.cleanupBetweenTests()`): Clears captured client calls, purges RMQ queues, resets trigger timestamps, cleans DB tables. MSW handlers reset separately in `beforeEach` via `server.resetHandlers()`.
4. **Suite teardown** (`afterAll`): Stops all apps, closes DB, `server.close()`
5. **Global teardown**: Stops RabbitMQ container

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
import { server } from '../../src/setup/msw-server';
import { TelegramTestHelper, TestCleanup } from '../../src/helpers';

const useActiveProposal = (proposal: OnchainProposal) =>
  server.use(proposalsHandler({ items: [proposal], totalCount: 1 }));

test('should send notification for new proposal', async () => {
  // 1. Create test data via factories
  await UserFactory.createWithSubscription({ channel: 'telegram', daoId: 'ENS' });

  // 2. Override the relevant kubb MSW handler with the test's data.
  //    Defaults in `msw-server.ts` return empty envelopes for every endpoint,
  //    so tests only need to override what they exercise. Wrap `server.use(...)`
  //    in a module-top helper (above describe); never inline `server.use` in tests.
  useActiveProposal(proposal);

  // 3. Wait for delivery via the SimpleTelegramClient's captured calls
  const helper = new TelegramTestHelper(global.telegramClient);
  const message = await helper.waitForMessage(msg => msg.text.includes('New governance proposal'));

  // 4. Assert
  expect(message.text).toContain('New governance proposal');
});
```

For endpoints that filter on query params (e.g., non-voter lookup that filters by `addresses[]`), pass a resolver instead of a static envelope. Use the shared `nonVotersResolver` helper from `src/setup/msw-server.ts`:

```typescript
import { proposalNonVotersHandler } from '@anticapture/client/msw';
import { server, nonVotersResolver } from '../../src/setup/msw-server';

server.use(proposalNonVotersHandler(nonVotersResolver(votes)));
```

## Vitest Configuration

See `vitest.config.ts`:
- `testTimeout`: 120,000ms (RabbitMQ + DB boot)
- `pool: 'forks'`, `fileParallelism: false` (sequential — shared RabbitMQ container)
- `globals: true`, `restoreMocks: true`
- `globalSetup`: `./src/setup/vitest/global-setup.ts`
- `setupFiles`: `./src/setup/vitest/setup.ts`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_RABBITMQ_URL` | Auto | Set by global setup from testcontainers |
| `SEND_REAL_TELEGRAM` | No | Set `true` to forward sends to a real Telegram bot (needs `TELEGRAM_BOT_TOKEN`) |
| `SEND_REAL_SLACK` | No | Set `true` to forward sends to a real Slack bot (needs `SLACK_BOT_TOKEN`, `SLACK_TEST_CHANNEL_ID`, `SLACK_WORKSPACE_ID`) |
| `TOKEN_ENCRYPTION_KEY` | No | Default test key provided |
