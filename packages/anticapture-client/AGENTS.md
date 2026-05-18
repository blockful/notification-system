# AntiCapture Client

Wrapper around `@anticapture/client` (the official REST SDK) that adds retry-with-backoff, per-attempt timeout, address normalization (checksum), and parallel fan-out across DAOs. Consumed by the `dispatcher`, `logic-system`, and `consumers` apps.

## Project Structure

```
src/
├── anticapture-client.ts       # Main client — fan-out per DAO, address normalization, SDK integration
├── types.ts                    # Shared types (ProcessedVotingPowerHistory, OffchainProposalItem, OffchainVoteItem)
├── with-retry-and-timeout.ts   # Generic helper: retry with backoff + per-attempt timeout via AbortController
├── test-doubles.ts             # `makeAnticaptureClient` / `noopAnticaptureClient` for use in consumer tests
└── index.ts                    # Public exports
tests/
├── anticapture-client.test.ts
├── offchain-proposal.test.ts
├── with-retry-and-timeout.test.ts
├── test-helpers.ts
└── constants.ts
```

## Client API

```typescript
class AnticaptureClient implements IAnticaptureClient {
  getDAOs(): Promise<DaoInfo[]>
  getProposalById(id: string): Promise<OnchainProposal | null>
  listProposals(variables?, daoId?): Promise<OnchainProposal[]>
  listVotingPowerHistory(variables?, daoId?): Promise<ProcessedVotingPowerHistory[]>
  listVotes(daoId, variables?): Promise<OnchainVote[]>
  getProposalNonVoters(proposalId, daoId, addresses?): Promise<Voter[]>
  getOffchainProposalNonVoters(proposalId, addresses?): Promise<OffchainNonVoter[]>
  listRecentVotesFromAllDaos(timestampGt, limit?): Promise<VoteWithDaoId[]>
  getEventThreshold(daoId, type, relevance): Promise<string | null>
  listOffchainProposals(variables?, daoId?): Promise<(OffchainProposalItem & { daoId: string })[]>
  listOffchainVotes(daoId, variables?): Promise<OffchainVoteItem[]>
  listRecentOffchainVotesFromAllDaos(fromDate, limit?): Promise<OffchainVoteWithDaoId[]>
}
```

Features: exponential backoff retry via `with-retry-and-timeout.ts` (1s, 2s, 4s, 8s by default), per-attempt timeout via `AbortController`, address normalization (checksum on request, lowercase on response) via `viem`, parallel fan-out across DAOs when `daoId` isn't specified.

## Test Doubles

For use in other apps' tests:

```typescript
import { makeAnticaptureClient, noopAnticaptureClient } from '@notification-system/anticapture-client';
```

- `makeAnticaptureClient(overrides)` — creates an in-memory client with customizable behavior, defaults to no-op responses for any method not overridden.
- `noopAnticaptureClient` — singleton implementing `IAnticaptureClient` and returning empty responses for every method.

## Testing

```bash
pnpm client test
```

Runs on **Vitest**. To stub the underlying SDK's HTTP layer in other apps' integration tests, use **MSW** (see `apps/integrated-tests/src/setup/msw-server.ts`).

## Dependencies

- `@anticapture/client` — Official REST SDK
- `viem` — Address validation / checksum normalization
