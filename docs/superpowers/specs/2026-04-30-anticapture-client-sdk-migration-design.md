# Anticapture Client — SDK Migration Design

**Date:** 2026-04-30
**Author:** Leonardo Vieira
**Status:** Draft

## Goal

Migrate the internals of `packages/anticapture-client` to consume the published `@anticapture/client` npm SDK, while preserving the package's existing public API so that no consumer (38 call sites across logic-system, dispatcher, consumers, integrated-tests) needs to change.

## Non-goals

- Migrating tests from `jest.mock` to MSW. Deferred to a separate PR.
- Removing the `AnticaptureClient` wrapper class.
- Changing the repository layer.
- Changing how `app.ts` boots services (beyond the construction signature of the client).
- Removing address normalization (kept for safety; revisited later).

## Context

The local `@notification-system/anticapture-client` package is a thin GraphQL client (axios + axios-retry + zod + viem) over the Anticapture Gateful GraphQL endpoint. It exposes a class `AnticaptureClient` with ~13 methods that 38 files across the monorepo depend on.

Anticapture has now published `@anticapture/client` v1.0.0 on npm — a Kubb-generated **REST/OpenAPI** SDK over the Gateful API. It is functional (no class), stateless, and lacks features the local client provides today: retry, timeout, address normalization, multi-DAO fan-out, fail-soft per-DAO error handling, runtime Zod validation, and global cross-DAO sorting.

PR #249 (`refactor/kubb-proposal-finished`) explored an inline approach (no wrapper) for one trigger. It surfaced two regressions: `Promise.all` cascading failures (instead of `allSettled`) and loss of DAO metadata (`supportOffchainData`, `chainId`) by relying on the static `proposalsPathParamsDaoEnum`.

## Decision

Keep the wrapper. Replace its internals.

`packages/anticapture-client` retains its current public API (class name, method signatures, return shapes, exported types and enums). Internally, methods stop building GraphQL requests via axios and instead delegate to functions from `@anticapture/client`. All cross-cutting concerns (fan-out, fail-soft, sort, transformations, header injection, retry, timeout, address normalization) remain inside the wrapper.

## Rationale

Considered three shapes:

1. **Inline / no wrapper** (the PR #249 approach). Rejected: duplicates fan-out across ~5 repositories, loses fail-soft, requires reworking tracing and config injection.
2. **Helper utilities** (`fanoutPerDao`, `withRetry`, etc., consumed by repositories). Rejected for this PR: forces churn in 38 callers and 38 test files for marginal architectural benefit. Worth revisiting later if the wrapper grows brittle.
3. **Wrapper with new internals** (chosen). Touches one package; zero changes for callers and existing tests.

The wrapper is a thin shim for some methods (`getEventThreshold`, `getProposalById`), but it is genuinely load-bearing for the multi-DAO methods (fan-out, sort, fail-soft, `supportOffchainData` filter). Concentrating that logic in one place is cheaper than distributing it.

## Scope of changes

### Inside `packages/anticapture-client/`

- `package.json`: add `@anticapture/client`. Remove `axios`, `axios-retry`, `graphql`, `@graphql-typed-document-node/core`, and the `@graphql-codegen/*` devDependencies. Keep `viem` (for address normalization) and `zod` (for runtime transformations in `schemas.ts`).
- `src/anticapture-client.ts`: rewrite each method to delegate to the equivalent function from `@anticapture/client`. Preserve every existing public signature and return type.
- `src/schemas.ts`: keep `processProposals`, `processVotingPowerHistory`, `FeedEventType`, `FeedRelevance`, and `ProcessedVotingPowerHistory`. Drop the `Safe*ResponseSchema` Zod schemas that only validated GraphQL response shape (Kubb-generated TypeScript types replace them).
- `src/index.ts`: keep current named exports. Add re-exports/aliases for any enum or type that callers import today (e.g. `OrderDirection`, `QueryInput_Proposals_Status_Items`) so consumer imports keep working.
- Delete: `queries/*.graphql`, `codegen.yaml`, `src/gql/`.
- Tests inside the package (`tests/anticapture-client.test.ts`, `tests/offchain-proposal.test.ts`): update to point at the new internals. The package already has `msw` as a devDependency — these tests can use MSW directly.

### Constructor change

The constructor signature changes from:

```ts
new AnticaptureClient(httpClient: AxiosInstance, maxRetries?, timeout?)
```

to something like:

```ts
new AnticaptureClient(config: {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
})
```

This is the only consumer-visible change. The 3 application boot files (`apps/logic-system/src/app.ts`, `apps/dispatcher/src/app.ts`, `apps/consumers/src/app.ts`) need their construction call updated. No other caller sees the change.

### Header injection

`x-client-source: notification-system` is configured globally via `setClientConfig({ defaultHeaders })` once during the wrapper's first instantiation (or explicitly at boot). Per-request header injection is avoided to keep the SDK call sites clean.

**Assumption to validate early in implementation:** `@anticapture/client` v1.0.0 exposes `setClientConfig` with the shape `{ defaultHeaders?: Record<string, string> }`. If the actual SDK API differs (e.g. takes a `baseURL` only, or uses a different name), the construction strategy needs adjustment — verify on the first commit by importing it and checking types.

### Retry and timeout

Reimplemented as a small helper inside the wrapper (since the SDK uses plain `fetch` with no retry plugin). Implementation: a manual exponential-backoff loop (a few lines around each SDK call) — no new dependency. Retries on network errors and HTTP 5xx, matching the current `axios-retry` policy. Timeout via `AbortSignal` passed to each SDK call (default 15s, matching today).

### Address normalization

Kept as-is (`toChecksum` on input, `toLowercase` on output) for safety. A follow-up PR will verify whether the REST API already normalizes addresses end-to-end, and remove the helpers if redundant.

### `getDAOs` and DAO metadata

The wrapper continues to call the runtime `daos()` SDK function (not the static `proposalsPathParamsDaoEnum`). This preserves the `supportOffchainData` and `chainId` fields that the offchain methods and `listVotingPowerHistory` rely on. The temporary `blockTime: 12` hardcoding stays until the API exposes it (existing TODO).

## Architecture (unchanged)

```
[3 apps (logic-system, dispatcher, consumers)]
        ↓
[Repositories — proposal, votes, threshold, voting-power, offchain-*]
        ↓
[AnticaptureClient — same public API, new internals]
        ↓
[@anticapture/client (Kubb-generated REST SDK over Gateful)]
```

Tracing via `wrapWithTracing(new AnticaptureClient(...))` continues to work unchanged because the wrapper stays a class with named methods.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Type drift between GraphQL types and OpenAPI types (e.g., `__typename` not present in REST responses) | Inside the wrapper, adapt SDK responses to the shape today's callers expect. Add a small mapping layer per method where needed. |
| Enum names differ between codegen tools (Kubb vs graphql-codegen) | Re-export aliases from `src/index.ts` so caller imports (`OrderDirection`, `QueryInput_*`) keep working. |
| `setClientConfig` is global mutation — multiple instances with different headers would clobber each other | Acceptable: all 3 apps use the same `x-client-source`. Document this. Revisit if a future use case needs per-instance config. |
| Fail-soft contract change (callers expect `[]`/`null`, not throws) | Preserve fail-soft inside every wrapper method. The error class from the SDK (`ResponseErrorConfig`) is caught the same way the GraphQL errors were. |
| Tests in 38 files start failing because the public API drifted accidentally | Strong success criterion: "no caller and no caller-side test should need to change." Run the full test suite as the regression gate. |

## Success criteria

1. The full monorepo test suite passes with no test files modified outside `packages/anticapture-client/tests/`.
2. None of the 38 consumer files needs an import or call-site change, except for the 3 `app.ts` files where the constructor argument shape changes.
3. Smoke test: each of logic-system, dispatcher, consumers runs against the real Gateful API. "Equivalent notifications" is verified qualitatively — same trigger types fire on the same observed events; no quantitative parity check is required for this PR.
4. Address casing in DB writes is unchanged (verified by inspecting one notification's DAO/voter columns before and after).

## Manual verification before merge

1. Run logic-system + dispatcher + consumers locally against the Gateful API; observe that proposals, votes, voting-power events flow through and notifications are dispatched.
2. Capture one response from `GET /{dao}/proposals/{id}/non-voters` with a curl call and inspect the address casing — confirms whether normalization is still doing real work.
3. Run the full Jest suite. Zero changes outside `packages/anticapture-client/`.
4. Manually trigger a fan-out path (e.g. force one DAO to 500) and confirm the trigger still produces results from the other DAOs (fail-soft preserved).

## Out of scope (future work)

- **MSW migration**: replacing `jest.mock('@notification-system/anticapture-client')` mocks with MSW interceptors at the `fetch` boundary. Tracked separately.
- **Address normalization removal**: requires verifying that the REST API normalizes addresses end-to-end. Tracked separately.
- **Wrapper removal / repos absorbing logic**: revisit only if the wrapper turns out to add no value after this migration.
- **Static DAO enum vs runtime `daos()`**: revisit only if the runtime call becomes a measurable cost.

## SDK Surface (verified 2026-04-30)

### Functions

| Wrapper method | SDK function | Exact import |
|---|---|---|
| getDAOs() | getDaos() | `import { getDaos } from '@anticapture/client'` |
| getProposalById(id) | proposal(dao, id) | `import { proposal } from '@anticapture/client'` |
| listProposals(vars?, daoId?) | proposals(dao, params?) | `import { proposals } from '@anticapture/client'` |
| listVotingPowerHistory(vars?, daoId?) | historicalVotingPower(dao, params?) | `import { historicalVotingPower } from '@anticapture/client'` |
| listVotes(daoId, vars?) | votes(dao, params?) | `import { votes } from '@anticapture/client'` |
| getProposalNonVoters(proposalId, daoId, addresses?) | proposalNonVoters(dao, id, params?) | `import { proposalNonVoters } from '@anticapture/client'` |
| getOffchainProposalNonVoters(proposalId, addresses?) | offchainProposalNonVoters(dao, id, params?) | `import { offchainProposalNonVoters } from '@anticapture/client'` |
| getEventThreshold(daoId, type, relevance) | getEventRelevanceThreshold(dao, params) | `import { getEventRelevanceThreshold } from '@anticapture/client'` |
| listOffchainProposals(vars?, daoId?) | offchainProposals(dao, params?) | `import { offchainProposals } from '@anticapture/client'` |
| listOffchainVotes(daoId, vars?) | votesOffchain(dao, params?) | `import { votesOffchain } from '@anticapture/client'` |

Notes:
- `getDaos()` takes no path param (returns all DAOs globally) — replaces fan-out loop seed.
- `proposal(dao, id)` returns `OnchainProposal` directly (not wrapped in `{ proposal: ... }`).
- All per-DAO functions take `dao` as first positional path param, not as a header.
- The DAO header (`anticapture-dao-id`) used in GraphQL is replaced by the path-param `dao` in REST.

### Client configuration shape

There is **no `setClientConfig` function**. The SDK exports a `client` function and each API function accepts an optional `config` object with a `client` override.

To set `baseURL` and default headers, pass them per-call in the `config` argument:

```ts
// Exact type exported from '@anticapture/client':
type RequestConfig<TData = unknown> = {
  url?: string;
  method?: HttpMethod;
  params?: unknown;
  data?: TData | FormData;
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  signal?: AbortSignal;
  headers?: [string, string][] | Record<string, string>;
  baseURL?: string;
};

// Per-function config parameter (each function exposes this):
config?: Partial<RequestConfig> & { client?: Client }

// Client type:
type Client = <TData, TError, TVariables>(config: RequestConfig<TVariables>) => Promise<ResponseConfig<TData>>;
```

**Migration approach for baseURL and custom headers:** The wrapper constructor will create a bound `client` closure that injects `baseURL` and `headers` (e.g., `x-client-source: notification-system`) into every call via the `config.client` override slot. This replaces the current axios-instance approach.

### Enums and types

| Caller import today (from `@notification-system/anticapture-client`) | SDK export (from `@anticapture/client`) | Values | Strategy |
|---|---|---|---|
| `OrderDirection` | `OrderDirection` | `"asc"` \| `"desc"` (lowercase) | **Breaking change**: GraphQL used uppercase `ASC`/`DESC`; SDK uses lowercase `asc`/`desc`. Re-export with alias, update internal usages. |
| `QueryInput_Votes_OrderBy` | `votesQueryParamsOrderByEnum` / `VotesQueryParamsOrderByEnumKey` | `"timestamp"` \| `"votingPower"` | Alias in index.ts as `QueryInput_Votes_OrderBy = { Timestamp: 'timestamp', VotingPower: 'votingPower' }` |
| `QueryInput_VotesOffchain_OrderBy` | `votesOffchainQueryParamsOrderByEnum` / `VotesOffchainQueryParamsOrderByEnumKey` | `"timestamp"` \| `"votingPower"` | Same alias pattern |
| `QueryInput_Proposals_Status_Items` | `onchainProposalStatusListEnum` / `OnchainProposalStatusListEnumKey` | `"PENDING"` \| `"ACTIVE"` \| `"CANCELED"` \| ... \| `"NO_QUORUM"` (uppercase) | Values match GraphQL enum values. Re-export alias. |
| `QueryInput_HistoricalVotingPower_OrderBy` | `historicalVotingPowerQueryParamsOrderByEnum` | `"timestamp"` \| `"delta"` | Alias in index.ts |
| `FeedEventType` | `FeedEventType` | `"VOTE"` \| `"PROPOSAL"` \| `"DELEGATION"` \| `"TRANSFER"` \| `"PROPOSAL_EXTENDED"` | Values match — re-export directly |
| `FeedRelevance` | `FeedRelevance` | `"HIGH"` \| `"MEDIUM"` \| `"LOW"` | Values match — re-export directly |
| `OnchainProposal` | `OnchainProposal` | Full proposal shape with `id`, `status`, `timestamp`, etc. | Re-export type directly |
| `OffchainProposal` | `OffchainProposal` | Full offchain shape — **richer than current**: adds `spaceId`, `author`, `body`, `type`, `flagged`, `scores`, `choices`, `network`, `snapshot`, `strategies`, `updated` | Superset of `OffchainProposalItem`; callers only use subset. Current `OffchainProposalItem` type will be a local alias/pick. |
| `GetProposalByIdQuery['proposal']` | `OnchainProposal` | Same shape | Update internal type ref |
| `ListProposalsQueryVariables` | `ProposalsQueryParams` | Different field names (`fromDate` vs `fromDate` ✓, `status: OnchainProposalStatusList` vs array) | Replace at usage sites inside wrapper |
| `VoteWithDaoId` | Local type (derived from `OnchainVote & { daoId: string }`) | `OnchainVote` has same fields: `voterAddress`, `transactionHash`, `proposalId`, `support?`, `votingPower`, `reason?`, `timestamp`, `proposalTitle?` | Keep local type, derive from `OnchainVote` |
| `OffchainVoteWithDaoId` | Local type (derived from `OffchainVote & { daoId: string }`) | `OffchainVote` fields: `voter`, `proposalId`, `choice?`, `vp`, `reason`, `created`, `proposalTitle?` — **different from current `OffchainVoteItem`** (`proposalTitle` was missing, `vp` type is `number\|null` not `number\|null\|undefined`) | Update internal type; `OffchainVoteItem` re-derived from `OffchainVote` |

### Key type shape differences (REST vs GraphQL responses)

| Field | GraphQL today | REST SDK | Impact |
|---|---|---|---|
| `OffchainProposalItem.link` | present | `OffchainProposal.link` present | No change |
| `OffchainProposalItem.discussion` | present | `OffchainProposal.discussion` present | No change |
| `OffchainVoteItem.proposalTitle` | present | `OffchainVote.proposalTitle: string \| null` | Minor: was optional, now `null`-able |
| `OffchainVoteItem.vp` | `number \| null \| undefined` | `number \| null` | Minor: undefined → null coercion |
| `Voter.voter` | `voter: string` | `voter: string` | No change |
| `Voter.votingPower` | not present in `ProposalNonVoter` (only `voter`) | `Voter.votingPower: string` — **SDK returns more fields** | Additive; existing callers only use `voter` |
| `HistoricalVotingPower.accountId` | present | present | No change |
| `HistoricalVotingPower.daoId` | present | present | No change |
| `HistoricalVotingPower.delegation` | `{ from, to, value, previousDelegate }` | `HistoricalVotingPowerDelegation` — need to verify field names match | Verify in Task 5 |
| `OrderDirection.Asc/Desc` (enum) | `"ASC"` / `"DESC"` | `"asc"` / `"desc"` | **Breaking in wrapper internals** — update usages inside wrapper |

### Differences from spec assumptions

1. **No `setClientConfig`**: The spec assumed a `setClientConfig(baseURL, defaultHeaders)` call. The SDK has no such global function. Instead, each function accepts `config.client` as a per-call override. The migration approach is: create a bound client closure in the wrapper constructor and pass it on every SDK call.

2. **`daos()` vs `getDaos()`**: The spec's placeholder used `daos()`. The actual SDK function is `getDaos()`. The per-DAO `getDao(dao)` function also exists for single-DAO retrieval.

3. **`OrderDirection` is lowercase**: GraphQL codegen produced uppercase (`ASC`, `DESC`). SDK uses lowercase (`asc`, `desc`). This requires updating the 4 internal usages inside `anticapture-client.ts`.

4. **`OffchainProposal` is richer than `OffchainProposalItem`**: The REST model has many additional fields (`spaceId`, `author`, `body`, `flagged`, `scores`, `choices`, `strategies`, etc.). This is additive and non-breaking.

5. **`proposalNonVoters` returns `Voter` not just `{ voter: string }`**: The REST response includes `votingPower`, `lastVoteTimestamp`, `votingPowerVariation` in addition to `voter`. Additive — current callers only access `.voter`.

6. **`getEventRelevanceThreshold` takes positional `dao` param + `params` object**: Current GraphQL takes `{ type, relevance }` as variables. SDK takes `dao` as path param and `{ type, relevance }` as query params. Wrapper maps this correctly.

7. **DEFAULT_BASE_URL is `/api/gateful`**: The SDK's default base URL is a relative path. The wrapper must always pass the absolute `baseURL` via the `config` parameter on every call.

### integrated-tests decision

Decision: **Skip affected integrated-tests in this PR with TODO comments**. Rationale: `apps/integrated-tests/src/mocks/graphql-mock-setup.ts` uses MSW to intercept GraphQL requests. After this migration those interceptors will no longer fire (the SDK uses `fetch` + REST, not axios + GraphQL). Migrating the mocks to MSW `http.*` handlers targeting the REST endpoints is out of scope for this PR (per the Non-goals section). The 3 affected test files (`graphql-mock-setup.ts`, `test-cleanup.ts`, and the fixtures/factories that import from it) will be annotated with `// TODO: update for REST SDK — see MSW migration PR`.

Files to annotate:
- `apps/integrated-tests/src/mocks/graphql-mock-setup.ts`
- `apps/integrated-tests/src/helpers/utilities/test-cleanup.ts`
- `apps/integrated-tests/src/fixtures/factories/voting-power-factory.ts`
- `apps/integrated-tests/src/setup/services/apps.ts`
