# Snapshot Voting Reminder — Design Spec

## Overview

Add voting reminders for off-chain (Snapshot) proposals. When 75% of a Snapshot proposal's voting period has elapsed, users who haven't voted receive a reminder via Telegram/Slack.

## Key Decisions

- **Single threshold:** 75% (with 5% window: 75-80%)
- **Single message template:** moderate urgency tone
- **NotificationTypeId:** `offchain-voting-reminder-75`
- **Approach:** Generalize existing `VotingReminderTrigger` with a normalized `VotingReminderProposal` interface. Mapper functions handle field differences between on-chain and off-chain. Separate dispatcher handler for off-chain.

## Architecture

### Data Flow

```
OffchainProposalRepository.listActiveForReminder()
  -> mapOffchainToReminderProposal()              (mapper)
  -> VotingReminderTrigger<VotingReminderProposal> (filters by 75-80% window)
  -> VotingReminderEvent via RabbitMQ              (dispatcher-queue)
  -> OffchainVotingReminderTriggerHandler          (dispatcher)
    -> getFollowedAddresses(daoId)
    -> getOffchainProposalNonVoters(proposalId, addresses)
    -> offchainVotingReminderMessages template
    -> RabbitMQ -> Telegram/Slack consumers
```

### Normalized Interface

```typescript
interface VotingReminderProposal {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTime: number;
  endTime: number;
  link?: string;        // proposal URL (Snapshot link for off-chain)
  discussion?: string;  // forum discussion URL (off-chain only)
}
```

Note: `description` is optional because off-chain proposals don't have a description field. `link` and `discussion` are optional — only populated for off-chain proposals and used by the dispatcher handler to build Snapshot/discussion buttons.

Both `ProposalRepository` and `OffchainProposalRepository` implement:

```typescript
interface VotingReminderDataSource {
  listActiveForReminder(): Promise<VotingReminderProposal[]>;
}
```

### Mapper Functions

Located in `apps/logic-system/src/mappers/proposal-reminder.mapper.ts`:

- `mapOnchainToReminderProposal(p: ProposalOnChain): VotingReminderProposal` — maps `timestamp -> startTime`, `endTimestamp -> endTime`, `description -> description`
- `mapOffchainToReminderProposal(p: OffchainProposal): VotingReminderProposal` — maps `(start ?? created) -> startTime`, `end -> endTime`, `link -> link`, `discussion -> discussion`. Uses `start` (actual voting start) when available, falls back to `created`.

### Trigger Generalization

`VotingReminderTrigger` becomes generic, accepting `VotingReminderDataSource` instead of `ProposalDataSource`. The trigger works exclusively with `VotingReminderProposal` — no knowledge of on-chain vs off-chain.

Existing on-chain triggers (30%, 60%, 90%) continue working with the same logic, just with `ProposalRepository.listActiveForReminder()` as data source.

## New Files

| File | Purpose |
|------|---------|
| `apps/logic-system/src/mappers/proposal-reminder.mapper.ts` | Mapper functions for on-chain and off-chain proposals |
| `apps/dispatcher/src/services/triggers/offchain-voting-reminder-trigger.service.ts` | Dispatcher handler for off-chain voting reminders |
| `packages/messages/src/triggers/offchain-voting-reminder.ts` | Message template |

## Modified Files

| File | Change |
|------|--------|
| `packages/anticapture-client/src/anticapture-client.ts` | Add `getOffchainProposalNonVoters(proposalId, addresses)` method |
| `packages/messages/src/notification-types.ts` | Add `OffchainVotingReminder75 = 'offchain-voting-reminder-75'` to enum and `NOTIFICATION_TYPES` record |
| `apps/logic-system/src/triggers/voting-reminder-trigger.ts` | Generalize to work with `VotingReminderProposal` and `VotingReminderDataSource` |
| `apps/logic-system/src/repositories/proposal.repository.ts` | Add `listActiveForReminder()` using `mapOnchainToReminderProposal` |
| `apps/logic-system/src/repositories/offchain-proposal.repository.ts` | Add `listActiveForReminder()` using `mapOffchainToReminderProposal` |
| `apps/logic-system/src/app.ts` | Register new off-chain trigger (threshold 75) + pass updated repos to existing triggers + add to `stop()` and `resetTriggers()` |
| `apps/dispatcher/src/app.ts` | Register `OffchainVotingReminderTriggerHandler` for `OffchainVotingReminder75` |
| `packages/messages/src/triggers/buttons.ts` | Add button config for off-chain voting reminder (Snapshot link + discussion link) |
| Relevant `index.ts` files | Update exports |

## AntiCapture Client

New method:

```typescript
async getOffchainProposalNonVoters(
  proposalId: string,
  addresses?: string[]
): Promise<ProposalNonVoter[]>
```

Calls GraphQL `offchainProposalNonVoters(id, addresses, orderDirection)`. Returns same `ProposalNonVoter` interface (`{ voter, votingPower }`) as the on-chain equivalent. Does not require `daoId` — the Snapshot proposal ID already identifies the DAO.

## Dispatcher Handler

`OffchainVotingReminderTriggerHandler` — separate handler from on-chain. Differences:

| Aspect | On-chain | Off-chain |
|--------|----------|-----------|
| Non-voters query | `getProposalNonVoters(proposalId, daoId, addresses)` | `getOffchainProposalNonVoters(proposalId, addresses)` |
| Message template | `votingReminderMessages` (4 urgency levels) | `offchainVotingReminderMessages` (single template) |
| Buttons | On-chain proposal link | Snapshot link + discussion link |

Receives the same normalized `VotingReminderEvent` from the Logic System. The event includes `link` and `discussion` fields (carried from the normalized proposal) so the handler can build Snapshot/discussion buttons without extra API calls.

## Message Template

Single template with moderate urgency:

```
⏰ Snapshot Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ {{address}}'s vote hasn't been recorded yet

Don't miss your chance to participate!
```

## Prerequisites

- **API Gateway:** The `offchainProposalNonVoters` GraphQL query must be deployed and available. The anticapture-client must be regenerated to include the new query types.
- **Start time:** The off-chain mapper uses `start` (actual voting start) when available in `OffchainProposalItem`, falling back to `created`. If `start` is not in the current schema, it should be added to `OffchainProposalItemSchema` in `packages/anticapture-client/src/schemas.ts`.

## Testing

- **Service layer:** `offchain-voting-reminder-trigger.service.test.ts` (dispatcher handler)
- **Repository layer:** Tests for `listActiveForReminder()` in both repositories
- **Integration test:** End-to-end flow in `apps/integrated-tests/`
- **No mapper tests**
- Use `/testing` skill during implementation
