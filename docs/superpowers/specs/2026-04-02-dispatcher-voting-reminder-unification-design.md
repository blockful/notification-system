# Dispatcher Voting Reminder Handler Unification

## Problem

The dispatcher has two nearly-identical handler files for voting reminders:
- `voting-reminder-trigger.service.ts` (on-chain, ~174 lines)
- `offchain-voting-reminder-trigger.service.ts` (off-chain, ~162 lines)

These share ~90% of their logic. The logic-system already solved the same problem for triggers using a single `VotingReminderTrigger` class with dependency injection. The dispatcher should follow the same pattern.

## Design

### Pattern: Mirror the Logic-System Abstraction

In the logic-system:
- `VotingReminderDataSource` interface (1 method: `listActiveForReminder()`)
- `ProposalRepository` and `OffchainProposalRepository` both implement it
- `VotingReminderTrigger` is a single class, instantiated with different params

The dispatcher equivalent:
- `NonVotersSource` interface (1 method: `getNonVoters()`)
- Inline adapter objects in `app.ts` wrapping `anticaptureClient`
- `VotingReminderTriggerHandler` is a single class, instantiated with different params

### Three Differences to Resolve

#### 1. Non-Voters Fetching → `NonVotersSource` Interface

On-chain calls `anticaptureClient.getProposalNonVoters(id, daoId, addresses)`.
Off-chain calls `anticaptureClient.getOffchainProposalNonVoters(id, addresses)`.

Define a minimal interface that intentionally narrows to the common subset `{ voter: string }`. The offchain response also includes `votingPower`, but it is not used by the handler:

```typescript
// interfaces/voting-reminder.interface.ts
export interface NonVotersSource {
  getNonVoters(proposalId: string, daoId: string, addresses: string[]): Promise<{ voter: string }[]>;
}
```

Both on-chain and off-chain receive `daoId` in the signature. Off-chain simply ignores it. Adapter objects are created inline in `app.ts`:

```typescript
const onchainNonVotersSource: NonVotersSource = {
  getNonVoters: (id, daoId, addrs) => anticaptureClient.getProposalNonVoters(id, daoId, addrs)
};

const offchainNonVotersSource: NonVotersSource = {
  getNonVoters: (id, _daoId, addrs) => anticaptureClient.getOffchainProposalNonVoters(id, addrs)
};
```

#### 2. Message Templates → Normalize Shape

On-chain uses `votingReminderMessages.getMessageKey(threshold)` to select urgency-based templates.
Off-chain uses `offchainVotingReminderMessages.default` (single template).

Normalize by adding `getMessageKey()` to `offchainVotingReminderMessages`:

```typescript
// packages/messages/src/triggers/offchain-voting-reminder.ts
export const offchainVotingReminderMessages = {
  default: `...existing template...`,
  getMessageKey(thresholdPercentage: number): string {
    return 'default';
  }
};
```

Define the shared type that both message objects conform to:

```typescript
// interfaces/voting-reminder.interface.ts
export interface VotingReminderMessageSet {
  getMessageKey(thresholdPercentage: number): string;
  [key: string]: string | ((...args: any[]) => any) | Record<string, string>;
}
```

Now both message objects share the same access pattern:
```typescript
const key = messages.getMessageKey(threshold);
const template = messages[key];
```

#### 3. Buttons → Already Polymorphic

`buildButtons` already handles both trigger types via the `triggerType` discriminator. The `VotingReminderEvent` already carries all fields (`id`, `daoId`, `link`, `discussion`). The unified handler passes all available fields as a superset — `buildButtons` has all params optional and each trigger type config only reads the ones it needs, ignoring `undefined` values for irrelevant params.

```typescript
const buttons = buildButtons({
  triggerType: this.triggerType,
  daoId: event.daoId,
  proposalId: event.id,
  proposalUrl: event.link,
  discussionUrl: event.discussion,
});
```

### Additional Differences Handled by `triggerType`

#### Notification Dedup Key

On-chain uses `` `${event.id}-${threshold}-reminder` ``, off-chain uses `` `${event.id}-${threshold}-offchain-reminder` ``.
The unified handler derives the suffix from `triggerType`:

```typescript
const suffix = this.triggerType.includes('offchain') ? '-offchain-reminder' : '-reminder';
() => `${event.id}-${event.thresholdPercentage}${suffix}`
```

#### Title Fallback

On-chain uses `event.title || FormattingService.extractTitle(event.description ?? '')`.
Off-chain uses `event.title || 'Untitled Proposal'`.
The unified handler chains both fallbacks:

```typescript
const title = event.title || FormattingService.extractTitle(event.description ?? '') || 'Untitled Proposal';
```

#### Log Prefix and MessageId

Derived from `triggerType`: `[VotingReminderHandler]` vs `[OffchainVotingReminderHandler]`.
The handler uses `this.triggerType` to construct log messages and messageId prefixes.

### Unified Handler Constructor

```typescript
export class VotingReminderTriggerHandler extends BaseTriggerHandler<VotingReminderEvent> {
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient,
    private readonly nonVotersSource: NonVotersSource,
    private readonly messages: VotingReminderMessageSet,
    private readonly triggerType: string,  // 'votingReminder' | 'offchainVotingReminder'
  )
}
```

### Wiring in `app.ts`

```typescript
// On-chain (reuse same source + messages for all thresholds)
const onchainSource: NonVotersSource = {
  getNonVoters: (id, daoId, addrs) => anticaptureClient.getProposalNonVoters(id, daoId, addrs)
};

triggerProcessorService.addHandler(
  NotificationTypeId.VotingReminder30,
  new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, onchainSource, votingReminderMessages, 'votingReminder')
);
// Same for VotingReminder60, VotingReminder90

// Off-chain
const offchainSource: NonVotersSource = {
  getNonVoters: (id, _daoId, addrs) => anticaptureClient.getOffchainProposalNonVoters(id, addrs)
};

triggerProcessorService.addHandler(
  NotificationTypeId.OffchainVotingReminder75,
  new VotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient, offchainSource, offchainVotingReminderMessages, 'offchainVotingReminder')
);
```

## File Changes

| File | Action |
|------|--------|
| `apps/dispatcher/src/interfaces/voting-reminder.interface.ts` | **NEW** — `VotingReminderEvent`, `NonVotersSource`, `VotingReminderMessageSet` |
| `apps/dispatcher/src/services/triggers/voting-reminder-trigger.service.ts` | **REWRITE** — single unified handler |
| `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.ts` | **DELETE** |
| `apps/dispatcher/src/app.ts` | **MODIFY** — update wiring with inline adapters |
| `packages/messages/src/triggers/offchain-voting-reminder.ts` | **MODIFY** — add `getMessageKey()` |
| Integration tests | **VERIFY** — ensure existing tests still pass |

## What This Does NOT Change

- Logic-system triggers (already unified)
- `BaseTriggerHandler` base class
- `@notification-system/messages` `buildButtons` function
- `BatchNotificationService`
- `AnticaptureClient` API methods
- Notification dedup key format (preserved exactly for both on-chain and off-chain to avoid duplicate/missed notifications in production)
