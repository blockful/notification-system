# Logic System

Monitors the AntiCapture REST API on a polling interval and publishes trigger events to RabbitMQ when governance activity is detected.

## How It Works

1. `App.setupTriggers()` registers all trigger instances with their polling intervals
2. Each trigger extends the abstract `Trigger<T>` base class (`src/triggers/base-trigger.ts`)
3. On each interval tick: `fetchData()` -> `process(data)` -> publish to `dispatcher-queue`

## Trigger Base Class API

```typescript
abstract class Trigger<T> {
  constructor(id: string, interval: number);
  abstract fetchData(): Promise<T[]>;
  abstract process(data: T[], lastTimestamp?: string): Promise<void>;
  start(): void;   // Begins polling at configured interval
  stop(): void;    // Clears the interval timer
}
```

## Implemented Triggers

| Trigger | File | Description |
|---------|------|-------------|
| `new-proposal` | `new-proposal-trigger.ts` | Detects new governance proposals |
| `vote-confirmation` | `vote-confirmation-trigger.ts` | Detects vote submissions |
| `voting-power-changed` | `voting-power-changed-trigger.ts` | Detects delegation/balance changes |
| `proposal-finished` | `proposal-finished-trigger.ts` | Detects proposal outcome changes |
| `voting-reminder` | `voting-reminder-trigger.ts` | Time-based reminders for active proposals |
| `new-offchain-proposal` | `new-offchain-proposal-trigger.ts` | Detects new Snapshot (offchain) proposals |
| `offchain-proposal-finished` | `offchain-proposal-finished-trigger.ts` | Detects when Snapshot proposals end (`state: closed`) |

## Adding a New Trigger

1. Create `src/triggers/my-trigger.ts` extending `Trigger<MyDataType>`
2. Implement `fetchData()` to query via `AnticaptureClient`
3. Implement `process()` to publish events via `RabbitMQDispatcherService`
4. If needed, create a repository in `src/repositories/`
5. Register in `App.setupTriggers()` in `src/app.ts`

## Project Structure

```
src/
├── app.ts                    # Main app, dependency injection, trigger registration
├── index.ts                  # Entry point
├── config/env.ts             # Zod-validated environment config
├── api-clients/              # RabbitMQ dispatcher service (publishes to dispatcher-queue)
├── interfaces/               # Dispatcher and proposal interfaces
├── repositories/             # Data source wrappers (proposal, votes, voting-power)
└── triggers/                 # All trigger implementations + base class
tests/                        # Vitest tests (separate from src/)
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTICAPTURE_API_URL` | Yes | AntiCapture REST API base URL |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
| `TRIGGER_INTERVAL` | No | Polling interval in ms (default: 30000) |
| `PROPOSAL_STATUS` | No | Proposal status filter (default: ACTIVE) |

## Testing

```bash
pnpm logic-system test
```

Tests live in `tests/` directory (not `src/`). Uses Vitest. Prefer **`Simple*` in-memory doubles** (see `tests/simple-doubles.ts`) for the RabbitMQ dispatcher and repositories over `vi.fn()` mocks; use `vi.fn()` only for behaviorless seams (e.g. injected callbacks).

## Common Gotchas

- **State management**: Triggers track `lastTimestamp` to avoid processing duplicate events. When resetting, timestamps go back to 1 year ago.
- **Consecutive failures**: After 5 consecutive failures, a trigger auto-stops. Success resets the counter.
- **Multi-DAO processing**: Triggers iterate all DAOs returned by `AnticaptureClient.getDAOs()`.
