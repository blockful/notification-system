# AntiCapture Client

Shared GraphQL client for querying the AntiCapture governance API. Provides typed queries with auto-generated types from the GraphQL schema.

## GraphQL Codegen

```bash
pnpm client codegen
# or with custom endpoint:
ANTICAPTURE_GRAPHQL_ENDPOINT="https://..." pnpm client codegen
```

**Config**: `codegen.yaml` - uses `client-preset` with `@graphql-typed-document-node/core`.

**Important**: Files in `src/gql/` are auto-generated. Do NOT edit them manually. Edit the `.graphql` query files instead.

## Project Structure

```
queries/                        # GraphQL query definitions (edit these)
├── daos.graphql
├── proposals.graphql
├── votes.graphql
├── voting-power.graphql
└── proposalNonVoters.graphql
src/
├── anticapture-client.ts       # Main client class (axios + retry)
├── schemas.ts                  # Zod schemas for response validation + processing
├── index.ts                    # Public exports
└── gql/                        # AUTO-GENERATED - do not edit
    ├── graphql.ts              # Full type definitions
    ├── gql.ts                  # Document helpers
    ├── fragment-masking.ts
    └── index.ts
tests/
├── anticapture-client.test.ts  # Client tests
├── test-helpers.ts             # Test double / fake client factory (prefer over mocks)
└── constants.ts                # Test fixtures
```

## Client API

```typescript
class AnticaptureClient {
  getDAOs(): Promise<DAO[]>
  getProposalById(id: string): Promise<Proposal | null>
  listProposals(variables?, daoId?): Promise<Proposal[]>           // Multi-DAO when no daoId
  listVotingPowerHistory(variables?, daoId?): Promise<ProcessedVotingPowerHistory[]>
  listVotes(daoId, variables?): Promise<Vote[]>
  getProposalNonVoters(proposalId, daoId, addresses?): Promise<string[]>
  listRecentVotesFromAllDaos(timestampGt, limit?): Promise<VoteWithDaoId[]>
}
```

Features: automatic retries with exponential backoff (1s, 2s, 4s, 8s), address normalization (checksum format), multi-DAO parallel fetching.

## Testing

```bash
pnpm client test
```

Uses ts-jest. Tests in `tests/` directory. Prefer **stubs/fakes** for the HTTP layer (e.g. via a fake client or `createMockClient()`-style helper); we are moving away from mocks toward stubs and fakes.

## Dependencies

- `axios` + `axios-retry` - HTTP with automatic retries
- `graphql` + `@graphql-typed-document-node/core` - Type-safe queries
- `viem` - Address validation/normalization
- `zod` - Response schema validation
