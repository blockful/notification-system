# Snapshot Voting Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add voting reminders for off-chain (Snapshot) proposals at the 75% threshold, reusing the generalized `VotingReminderTrigger`.

**Architecture:** Generalize the existing `VotingReminderTrigger` to work with a normalized `VotingReminderProposal` interface. Mapper functions translate on-chain and off-chain proposal shapes. A new dispatcher handler processes off-chain reminders with its own message template and Snapshot-specific buttons.

**Tech Stack:** TypeScript, RabbitMQ, Zod, Jest, Fastify, GraphQL

**Spec:** `docs/superpowers/specs/2026-04-01-snapshot-voting-reminder-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `apps/logic-system/src/mappers/proposal-reminder.mapper.ts` | Pure mapper functions: on-chain → `VotingReminderProposal`, off-chain → `VotingReminderProposal` |
| `apps/logic-system/src/interfaces/voting-reminder.interface.ts` | `VotingReminderProposal` and `VotingReminderDataSource` interfaces |
| `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.ts` | Dispatcher handler for off-chain voting reminders |
| `packages/messages/src/triggers/offchain-voting-reminder.ts` | Message template for Snapshot voting reminders |
| `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.test.ts` | Unit tests for the off-chain handler |

### Modified Files
| File | Change |
|------|--------|
| `packages/anticapture-client/src/schemas.ts` | Add `start` to `OffchainProposalItemSchema`, add `SafeOffchainProposalNonVotersResponseSchema` |
| `packages/anticapture-client/src/anticapture-client.ts` | Add `getOffchainProposalNonVoters()` method |
| `packages/anticapture-client/src/index.ts` | Export new types if needed |
| `packages/messages/src/notification-types.ts` | Add `OffchainVotingReminder75` to enum and `NOTIFICATION_TYPES` |
| `packages/messages/src/triggers/buttons.ts` | Add `offchainVotingReminder` button config |
| `packages/messages/src/index.ts` | Export new offchain voting reminder messages |
| `apps/logic-system/src/triggers/voting-reminder-trigger.ts` | Refactor to use `VotingReminderProposal` and `VotingReminderDataSource` |
| `apps/logic-system/src/repositories/proposal.repository.ts` | Add `listActiveForReminder()` |
| `apps/logic-system/src/repositories/offchain-proposal.repository.ts` | Add `listActiveForReminder()` |
| `apps/logic-system/src/app.ts` | Register off-chain trigger, update existing triggers, add to `stop()`/`resetTriggers()` |
| `apps/dispatcher/src/app.ts` | Register `OffchainVotingReminderTriggerHandler` |

---

## Task 1: Messages Package — NotificationTypeId + Template + Buttons

**Files:**
- Modify: `packages/messages/src/notification-types.ts`
- Create: `packages/messages/src/triggers/offchain-voting-reminder.ts`
- Modify: `packages/messages/src/triggers/buttons.ts`
- Modify: `packages/messages/src/index.ts`

- [ ] **Step 1: Add enum entry**

In `packages/messages/src/notification-types.ts`, add to the enum:

```typescript
OffchainVotingReminder75 = 'offchain-voting-reminder-75',
```

And to the `NOTIFICATION_TYPES` record:

```typescript
[NotificationTypeId.OffchainVotingReminder75]: 'Offchain Vote Reminder 75%',
```

- [ ] **Step 2: Create message template**

Create `packages/messages/src/triggers/offchain-voting-reminder.ts`:

```typescript
export const offchainVotingReminderMessages = {
  default: `⏰ Snapshot Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ {{address}}'s vote hasn't been recorded yet

Don't miss your chance to participate!`,
};
```

- [ ] **Step 3: Add button config**

In `packages/messages/src/triggers/buttons.ts`, add to `ctaButtonConfigs`:

```typescript
offchainVotingReminder: {
  text: 'Cast your vote',
  buildUrl: ({ proposalUrl }) =>
    proposalUrl || BASE_URL
},
```

- [ ] **Step 4: Update exports**

In `packages/messages/src/index.ts`, add:

```typescript
export * from './triggers/offchain-voting-reminder';
```

- [ ] **Step 5: Build messages package to verify**

Run: `cd packages/messages && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add packages/messages/
git commit -m "feat: add offchain voting reminder message template, enum, and button config"
```

---

## Task 2: AntiCapture Client — Schema + `getOffchainProposalNonVoters()`

**Files:**
- Modify: `packages/anticapture-client/src/schemas.ts`
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/src/index.ts`

- [ ] **Step 1: Add `start` to `OffchainProposalItemSchema`**

In `packages/anticapture-client/src/schemas.ts`, update `OffchainProposalItemSchema`:

```typescript
export const OffchainProposalItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  discussion: z.string(),
  link: z.string(),
  state: z.string(),
  start: z.number().optional(),
  created: z.number(),
  end: z.number(),
});
```

Note: `start` is optional for backwards compatibility with responses that may not include it.

- [ ] **Step 2: Add Zod schema for offchain non-voters response**

In `packages/anticapture-client/src/schemas.ts`, add after `SafeProposalNonVotersResponseSchema`:

```typescript
export const SafeOffchainProposalNonVotersResponseSchema = z.object({
  offchainProposalNonVoters: z.object({
    items: z.array(z.object({
      voter: z.string(),
      votingPower: z.string().optional()
    }).nullable()),
    totalCount: z.number().optional()
  }).nullable()
}).transform((data) => {
  if (!data.offchainProposalNonVoters) {
    console.warn('OffchainProposalNonVotersResponse has null offchainProposalNonVoters:', data);
    return { offchainProposalNonVoters: { items: [], totalCount: 0 } };
  }
  return {
    offchainProposalNonVoters: {
      ...data.offchainProposalNonVoters,
      items: data.offchainProposalNonVoters.items.filter((item): item is { voter: string; votingPower?: string } => item !== null)
    }
  };
});
```

- [ ] **Step 3: Add `getOffchainProposalNonVoters` method**

In `packages/anticapture-client/src/anticapture-client.ts`, add the import for the new schema and add the method.

First, add the import:
```typescript
import { SafeOffchainProposalNonVotersResponseSchema } from './schemas';
```

Then add the method to the `AnticaptureClient` class (after `getProposalNonVoters`):

```typescript
/**
 * Fetches addresses that haven't voted on a specific offchain (Snapshot) proposal
 * @param proposalId The Snapshot proposal ID to check
 * @param addresses Optional array of addresses to filter by
 * @returns List of non-voters
 */
async getOffchainProposalNonVoters(
  proposalId: string,
  addresses?: string[],
): Promise<{ voter: string; votingPower?: string }[]> {
  try {
    const response = await this.httpClient.post('', {
      query: `query OffchainProposalNonVoters($id: String!, $addresses: String, $orderDirection: String) {
        offchainProposalNonVoters(id: $id, addresses: $addresses, orderDirection: $orderDirection) {
          items {
            voter
            votingPower
          }
        }
      }`,
      variables: {
        id: proposalId,
        ...(addresses && { addresses: addresses.join(',') }),
        orderDirection: 'desc'
      }
    }, { headers: this.buildHeaders() });

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }

    const validated = SafeOffchainProposalNonVotersResponseSchema.parse(
      this.toLowercase(response.data.data)
    );

    return validated.offchainProposalNonVoters.items;
  } catch (error) {
    console.warn(`Error fetching offchain non-voters for proposal ${proposalId}:`, error);
    return [];
  }
}
```

**Important:** Check how the `addresses` parameter is passed in the actual GraphQL query by testing against the local API Gateway endpoint. The query from the user used `addresses: "0x89EdE..."` as a single string. Adjust accordingly — it might be a comma-separated string rather than an array.

- [ ] **Step 4: Build anticapture-client package to verify**

Run: `cd packages/anticapture-client && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add packages/anticapture-client/
git commit -m "feat: add getOffchainProposalNonVoters method and start field to OffchainProposalItemSchema"
```

---

## Task 3: Logic System — Interfaces + Mappers

**Files:**
- Create: `apps/logic-system/src/interfaces/voting-reminder.interface.ts`
- Create: `apps/logic-system/src/mappers/proposal-reminder.mapper.ts`

- [ ] **Step 1: Create normalized interfaces**

Create `apps/logic-system/src/interfaces/voting-reminder.interface.ts`:

```typescript
/**
 * Normalized proposal data for voting reminders.
 * Both on-chain and off-chain proposals are mapped to this shape.
 */
export interface VotingReminderProposal {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTime: number;
  endTime: number;
  link?: string;
  discussion?: string;
}

/**
 * Data source interface for fetching proposals ready for voting reminders.
 * Implemented by both ProposalRepository and OffchainProposalRepository.
 */
export interface VotingReminderDataSource {
  listActiveForReminder(): Promise<VotingReminderProposal[]>;
}
```

- [ ] **Step 2: Create mapper functions**

Create `apps/logic-system/src/mappers/proposal-reminder.mapper.ts`:

```typescript
import { ProposalOnChain } from '../interfaces/proposal.interface';
import { OffchainProposal } from '../interfaces/offchain-proposal.interface';
import { VotingReminderProposal } from '../interfaces/voting-reminder.interface';

/**
 * Maps an on-chain proposal to the normalized VotingReminderProposal shape.
 */
export function mapOnchainToReminderProposal(p: ProposalOnChain): VotingReminderProposal {
  return {
    id: p.id,
    daoId: p.daoId,
    title: p.title || undefined,
    description: p.description,
    startTime: Number(p.timestamp),
    endTime: Number(p.endTimestamp),
  };
}

/**
 * Maps an off-chain (Snapshot) proposal to the normalized VotingReminderProposal shape.
 * Uses `start` (actual voting start) when available, falls back to `created`.
 */
export function mapOffchainToReminderProposal(p: OffchainProposal): VotingReminderProposal {
  return {
    id: p.id,
    daoId: p.daoId,
    title: p.title || undefined,
    startTime: p.start ?? p.created,
    endTime: p.end,
    link: p.link,
    discussion: p.discussion,
  };
}
```

Note: Check whether `OffchainProposal` type has a `start` field after the schema update in Task 2. The `OffchainProposal` is defined as `OffchainProposalItem & { daoId: string }` in `apps/logic-system/src/interfaces/offchain-proposal.interface.ts`, so it inherits the `start` field from the schema update.

- [ ] **Step 3: Commit**

```bash
git add apps/logic-system/src/interfaces/voting-reminder.interface.ts apps/logic-system/src/mappers/
git commit -m "feat: add VotingReminderProposal interface and mapper functions"
```

---

## Task 4: Logic System — Generalize `VotingReminderTrigger`

**Files:**
- Modify: `apps/logic-system/src/triggers/voting-reminder-trigger.ts`

- [ ] **Step 1: Refactor trigger to use normalized interface**

Replace the current `VotingReminderTrigger` implementation. Key changes:

1. Change `extends Trigger<ProposalOnChain>` to `extends Trigger<VotingReminderProposal>`
2. Replace `ProposalDataSource` with `VotingReminderDataSource` in constructor
3. Replace all direct field access (`proposal.timestamp`, `proposal.endTimestamp`) with `proposal.startTime`, `proposal.endTime`
4. Remove `parseInt` calls (data is already normalized as numbers)
5. Add `link` and `discussion` to the `VotingReminderEvent` interface
6. Pass `link` and `discussion` through in `createReminderEvent()`
7. `fetchData()` calls `this.dataSource.listActiveForReminder()` instead of `this.proposalRepository.listAll()`

Updated `VotingReminderEvent`:

```typescript
export interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
  link?: string;
  discussion?: string;
}
```

Updated constants and constructor — add a `triggerIdPrefix` parameter to allow different prefixes for on-chain vs off-chain:

```typescript
const DEFAULT_TRIGGER_ID_PREFIX = 'voting-reminder';
const DEFAULT_WINDOW_SIZE = 5;

constructor(
  private readonly dispatcherService: DispatcherService,
  private readonly dataSource: VotingReminderDataSource,
  interval: number,
  thresholdPercentage: number = 75,
  windowSize: number = DEFAULT_WINDOW_SIZE,
  triggerIdPrefix: string = DEFAULT_TRIGGER_ID_PREFIX
) {
  super(`${triggerIdPrefix}-${thresholdPercentage}`, interval);
  ...
}
```

This way, on-chain triggers keep using `'voting-reminder'` (default) and the off-chain trigger passes `'offchain-voting-reminder'` to produce `offchain-voting-reminder-75` — matching `NotificationTypeId.OffchainVotingReminder75`.

Updated `filterEligibleProposals`:

```typescript
private filterEligibleProposals(proposals: VotingReminderProposal[]): VotingReminderProposal[] {
  const now = Math.floor(Date.now() / 1000);

  return proposals.filter(proposal => {
    if (!proposal) return false;

    const startTime = proposal.startTime;
    const endTime = proposal.endTime;

    if (now <= startTime || now >= endTime) return false;

    const timeElapsedPercentage = this.calculateTimeElapsedPercentage(startTime, endTime, now);
    const threshold = this.thresholdPercentage;
    const windowEnd = Math.min(threshold + this.windowSize, 100);

    return timeElapsedPercentage >= threshold && timeElapsedPercentage <= windowEnd;
  });
}
```

Updated `createReminderEvent`:

```typescript
private createReminderEvent(proposal: VotingReminderProposal): VotingReminderEvent {
  const now = Math.floor(Date.now() / 1000);
  const timeElapsedPercentage = this.calculateTimeElapsedPercentage(
    proposal.startTime, proposal.endTime, now
  );

  return {
    id: proposal.id,
    daoId: proposal.daoId,
    title: proposal.title,
    description: proposal.description,
    startTimestamp: proposal.startTime,
    endTimestamp: proposal.endTime,
    timeElapsedPercentage: Math.round(timeElapsedPercentage * 100) / 100,
    thresholdPercentage: this.thresholdPercentage,
    link: proposal.link,
    discussion: proposal.discussion,
  };
}
```

Updated `fetchData`:

```typescript
protected async fetchData(): Promise<VotingReminderProposal[]> {
  return await this.dataSource.listActiveForReminder();
}
```

- [ ] **Step 2: Update the on-chain VotingReminderTriggerHandler**

In `apps/dispatcher/src/services/triggers/voting-reminder-trigger.service.ts`, update `createReminderMessage`:

1. Handle optional `description`:
```typescript
const title = event.title || FormattingService.extractTitle(event.description ?? '');
```

2. Fix existing `address` placeholder bug — add `address` to replacePlaceholders call:
```typescript
return replacePlaceholders(messageTemplate, {
  daoId: event.daoId,
  title,
  timeRemaining,
  thresholdPercentage: event.thresholdPercentage.toString(),
  address: address || ''
});
```

- [ ] **Step 3: Update existing `voting-reminder-trigger.test.ts`**

The existing test at `apps/logic-system/tests/voting-reminder-trigger.test.ts` creates `ProposalOnChain` objects with string fields (`timestamp`, `endTimestamp`). After refactoring, the trigger expects `VotingReminderProposal` with numeric `startTime`/`endTime`.

Update the test to:
1. Use `VotingReminderProposal` objects instead of `ProposalOnChain`
2. Mock `dataSource.listActiveForReminder()` instead of `proposalRepository.listAll()`
3. Use numeric timestamp fields (`startTime`, `endTime`) instead of string fields

- [ ] **Step 4: Build logic-system to verify compilation**

Run: `cd apps/logic-system && pnpm build`
Expected: May fail because `app.ts` still passes old repository type. That's fine — we'll fix it in Task 5.

- [ ] **Step 5: Commit**

```bash
git add apps/logic-system/src/triggers/ apps/logic-system/tests/ apps/dispatcher/src/services/triggers/voting-reminder-trigger.service.ts
git commit -m "refactor: generalize VotingReminderTrigger to use normalized VotingReminderProposal interface"
```

---

## Task 5: Logic System — Update Repositories + App Wiring

**Files:**
- Modify: `apps/logic-system/src/repositories/proposal.repository.ts`
- Modify: `apps/logic-system/src/repositories/offchain-proposal.repository.ts`
- Modify: `apps/logic-system/src/app.ts`

- [ ] **Step 1: Add `listActiveForReminder()` to `ProposalRepository`**

In `apps/logic-system/src/repositories/proposal.repository.ts`:

Import the mapper and interface:
```typescript
import { VotingReminderProposal, VotingReminderDataSource } from '../interfaces/voting-reminder.interface';
import { mapOnchainToReminderProposal } from '../mappers/proposal-reminder.mapper';
```

Add `implements VotingReminderDataSource` to the class and add the method:

```typescript
async listActiveForReminder(): Promise<VotingReminderProposal[]> {
  const proposals = await this.listAll({ status: 'ACTIVE', includeOptimisticProposals: false });
  return proposals.map(mapOnchainToReminderProposal);
}
```

- [ ] **Step 2: Add `listActiveForReminder()` to `OffchainProposalRepository`**

In `apps/logic-system/src/repositories/offchain-proposal.repository.ts`:

Import the mapper and interface:
```typescript
import { VotingReminderProposal, VotingReminderDataSource } from '../interfaces/voting-reminder.interface';
import { mapOffchainToReminderProposal } from '../mappers/proposal-reminder.mapper';
```

Add `implements VotingReminderDataSource` to the class and add the method:

```typescript
async listActiveForReminder(): Promise<VotingReminderProposal[]> {
  const proposals = await this.listAll({ status: 'active' });
  return proposals.map(mapOffchainToReminderProposal);
}
```

- [ ] **Step 3: Wire up in `app.ts`**

In `apps/logic-system/src/app.ts`:

Add the new trigger field:
```typescript
private offchainVotingReminderTrigger75!: VotingReminderTrigger;
```

In `initializeRabbitMQ`, add the new trigger instance (note the `triggerIdPrefix` to produce `offchain-voting-reminder-75`):
```typescript
this.offchainVotingReminderTrigger75 = new VotingReminderTrigger(
  dispatcherService,
  offchainProposalRepository,
  triggerInterval,
  75, // 75% threshold
  5,  // default window size
  'offchain-voting-reminder' // prefix → produces ID 'offchain-voting-reminder-75'
);
```

Update the existing on-chain voting reminder triggers to pass the `proposalRepository` (which now implements `VotingReminderDataSource`). The constructor signature changed from `ProposalDataSource` to `VotingReminderDataSource`, but since `ProposalRepository` now implements both, this should just work.

In `start()`, add:
```typescript
this.offchainVotingReminderTrigger75.start();
```

In `stop()`, add:
```typescript
await this.offchainVotingReminderTrigger75.stop();
```

In `resetTriggers()`, add stop calls for all voting reminder triggers (currently missing for on-chain too). Since `stop()` only calls `clearInterval` (no real async I/O), use fire-and-forget to avoid making `resetTriggers` async (which would be a breaking change for callers in integration tests):
```typescript
if (this.votingReminderTrigger30) {
  this.votingReminderTrigger30.stop();
}
if (this.votingReminderTrigger60) {
  this.votingReminderTrigger60.stop();
}
if (this.votingReminderTrigger90) {
  this.votingReminderTrigger90.stop();
}
if (this.offchainVotingReminderTrigger75) {
  this.offchainVotingReminderTrigger75.stop();
}
```

- [ ] **Step 4: Build logic-system to verify**

Run: `cd apps/logic-system && pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Run existing tests**

Run: `cd apps/logic-system && pnpm test`
Expected: All existing tests pass (the generalization should not break them)

- [ ] **Step 6: Commit**

```bash
git add apps/logic-system/
git commit -m "feat: add listActiveForReminder to repositories and wire offchain voting reminder trigger"
```

---

## Task 6: Dispatcher — Off-chain Voting Reminder Handler

**Files:**
- Create: `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.ts`
- Modify: `apps/dispatcher/src/app.ts`

- [ ] **Step 1: Create the handler**

Create `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.ts`.

This handler is based on `voting-reminder-trigger.service.ts` with these differences:
- Uses `getOffchainProposalNonVoters(proposalId, addresses)` — no `daoId` param
- Uses `offchainVotingReminderMessages.default` template (single template)
- Uses `offchainVotingReminder` button type with `proposalUrl` from event's `link` field
- Adds discussion button if event has `discussion` field

```typescript
import type { NotificationTypeId } from '@notification-system/messages';
import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';
import { offchainVotingReminderMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';
import { BatchNotificationService } from '../batch-notification.service';

interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
  link?: string;
  discussion?: string;
}

interface ProcessingResult {
  sent: number;
  skipped: number;
  failed: number;
}

export class OffchainVotingReminderTriggerHandler extends BaseTriggerHandler<VotingReminderEvent> {
  private readonly batchNotificationService: BatchNotificationService;

  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
    this.batchNotificationService = new BatchNotificationService(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<VotingReminderEvent>): Promise<MessageProcessingResult> {
    const events = message.events;

    if (!events || events.length === 0) {
      return {
        messageId: `offchain-voting-reminder-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    const processedCount: ProcessingResult = { sent: 0, skipped: 0, failed: 0 };

    for (const event of events) {
      try {
        const result = await this.processReminderEvent(event, message.triggerId);
        processedCount.sent += result.sent;
        processedCount.skipped += result.skipped;
        processedCount.failed += result.failed;
      } catch (error) {
        processedCount.failed++;
      }
    }

    console.log(`[OffchainVotingReminderHandler] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`);

    return {
      messageId: `offchain-voting-reminder-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  private async processReminderEvent(event: VotingReminderEvent, triggerType: NotificationTypeId): Promise<ProcessingResult> {
    const subscribedAddresses = await this.subscriptionClient.getFollowedAddresses(event.daoId);

    if (subscribedAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    const nonVotingAddresses = await this.getNonVotingAddresses(event.id, subscribedAddresses);

    if (nonVotingAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    const buttons = buildButtons({
      triggerType: 'offchainVotingReminder',
      proposalUrl: event.link,
      discussionUrl: event.discussion,
    });

    const sentCount = await this.batchNotificationService.sendBatchNotifications(
      nonVotingAddresses,
      event.daoId,
      triggerType,
      () => `${event.id}-${event.thresholdPercentage}-offchain-reminder`,
      (address) => this.createReminderMessage(event, address),
      (address) => ({
        triggerType: 'offchainVotingReminder',
        proposalId: event.id,
        thresholdPercentage: event.thresholdPercentage,
        timeElapsedPercentage: event.timeElapsedPercentage,
        timeRemaining: FormattingService.calculateTimeRemaining(event.endTimestamp),
        addresses: { address: address }
      }),
      () => buttons
    );

    return { sent: sentCount, skipped: 0, failed: 0 };
  }

  private async getNonVotingAddresses(
    proposalId: string,
    subscribedAddresses: string[]
  ): Promise<string[]> {
    const nonVoters = await this.anticaptureClient!.getOffchainProposalNonVoters(
      proposalId,
      subscribedAddresses
    );
    return nonVoters.map(nv => nv.voter);
  }

  private createReminderMessage(event: VotingReminderEvent, address?: string): string {
    const timeRemaining = FormattingService.calculateTimeRemaining(event.endTimestamp);
    const title = event.title || 'Untitled Proposal';

    return replacePlaceholders(offchainVotingReminderMessages.default, {
      daoId: event.daoId,
      title,
      timeRemaining,
      thresholdPercentage: event.thresholdPercentage.toString(),
      address: address || ''
    });
  }
}
```

- [ ] **Step 2: Register handler in dispatcher `app.ts`**

In `apps/dispatcher/src/app.ts`:

Add import:
```typescript
import { OffchainVotingReminderTriggerHandler } from './services/triggers/offchain-voting-reminder-trigger.service';
```

Add handler registration (after the existing voting reminder handlers):
```typescript
triggerProcessorService.addHandler(
  NotificationTypeId.OffchainVotingReminder75,
  new OffchainVotingReminderTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient)
);
```

- [ ] **Step 3: Build dispatcher to verify**

Run: `cd apps/dispatcher && pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add apps/dispatcher/
git commit -m "feat: add OffchainVotingReminderTriggerHandler and register in dispatcher"
```

---

## Task 7: Tests — Service Layer (Dispatcher Handler)

**Files:**
- Create: `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.test.ts`

Use `/testing` skill before writing tests.

- [ ] **Step 1: Write tests for the handler**

Follow the same pattern as `voting-reminder-trigger.service.test.ts`. Key test cases:

1. **Empty events** — returns early with empty message result
2. **No subscribed addresses** — skips processing, returns skipped count
3. **No non-voting addresses** — all users already voted, skips
4. **Successful send** — processes event, calls `getOffchainProposalNonVoters` (without daoId), sends via batch, verifies message template used is `offchainVotingReminderMessages.default`
5. **Buttons include Snapshot link** — verifies `buildButtons` called with `triggerType: 'offchainVotingReminder'` and `proposalUrl`
6. **Discussion link** — verifies discussion button is included when event has `discussion` field

Mock setup: same pattern as existing test — mock `subscriptionClient`, `notificationFactory`, `anticaptureClient` with `getOffchainProposalNonVoters` instead of `getProposalNonVoters`.

- [ ] **Step 2: Run tests**

Run: `cd apps/dispatcher && pnpm test`
Expected: All tests pass (new + existing)

- [ ] **Step 3: Commit**

```bash
git add apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.test.ts
git commit -m "test: add unit tests for OffchainVotingReminderTriggerHandler"
```

---

## Task 8: Tests — Repository Layer

Use `/testing` skill before writing tests.

- [ ] **Step 1: Create repository test files and add `listActiveForReminder` tests**

No existing repository test files exist, so create:
- `apps/logic-system/src/repositories/offchain-proposal.repository.test.ts`
- `apps/logic-system/src/repositories/proposal.repository.test.ts`

For `OffchainProposalRepository`, test that:
1. `listActiveForReminder()` calls `listAll({ status: 'active' })`
2. Results are mapped correctly (fields renamed: `created/start -> startTime`, `end -> endTime`, `link` and `discussion` carried through)
3. `start` field used when available, falls back to `created`

For `ProposalRepository`, test that:
1. `listActiveForReminder()` calls `listAll({ status: 'ACTIVE', includeOptimisticProposals: false })`
2. Results are mapped correctly (`timestamp -> startTime`, `endTimestamp -> endTime`)

- [ ] **Step 2: Run tests**

Run: `cd apps/logic-system && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/logic-system/
git commit -m "test: add listActiveForReminder tests for proposal repositories"
```

---

## Task 9: Integration Test

Use `/testing` skill before writing tests.

**Files:**
- Create: `apps/integrated-tests/tests/telegram/offchain-voting-reminder-trigger.test.ts`

- [ ] **Step 1: Write integration test**

Follow the pattern from `apps/integrated-tests/tests/telegram/voting-reminder-trigger.test.ts`. Key differences:

1. Use off-chain proposal factory (Snapshot proposal shape with `created`/`end` timestamps)
2. Set up GraphQL mock to return active Snapshot proposals at ~77% elapsed time (within 75-80% window)
3. Mock `offchainProposalNonVoters` GraphQL endpoint to return test addresses
4. Verify Telegram notification received with correct template (Snapshot Voting Reminder)
5. Test that proposals outside the window (e.g., 50% elapsed) do NOT trigger reminders
6. Test that users who already voted do NOT receive reminders

- [ ] **Step 2: Run integration test**

Run: `cd apps/integrated-tests && pnpm test -- --testPathPattern=offchain-voting-reminder`
Expected: Test passes

- [ ] **Step 3: Commit**

```bash
git add apps/integrated-tests/
git commit -m "test: add integration test for offchain voting reminder flow"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Full build**

Run: `pnpm build` (from root)
Expected: All packages and apps build successfully

- [ ] **Step 2: Full test suite**

Run: `pnpm test` (from root)
Expected: All tests pass

- [ ] **Step 3: Final commit if any cleanup needed**
