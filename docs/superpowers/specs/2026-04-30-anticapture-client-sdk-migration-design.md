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
