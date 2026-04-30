# Anticapture Client SDK Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the internals of `@notification-system/anticapture-client` with `@anticapture/client` (Kubb-generated REST SDK) while preserving the public API so that no consumer (38 files) — except 3 `app.ts` constructor calls — needs to change.

**Architecture:** The wrapper class `AnticaptureClient` stays. Each method swaps its `axios + GraphQL` implementation for a delegated call to `@anticapture/client`. Cross-cutting concerns (fan-out, fail-soft per-DAO, sort, transformations, retry, timeout, address normalization, header injection) remain inside the wrapper.

**Tech Stack:** TypeScript, `@anticapture/client` v1.0.0 (Kubb-generated REST SDK), `viem` (address checksum), `msw` (package-internal tests only). Removed: `axios`, `axios-retry`, `graphql`, `@graphql-typed-document-node/core`, `@graphql-codegen/*`.

**Spec:** `docs/superpowers/specs/2026-04-30-anticapture-client-sdk-migration-design.md`

---

## File Structure

### Files modified

| Path | What changes |
|---|---|
| `packages/anticapture-client/package.json` | Add `@anticapture/client`. Remove `axios`, `axios-retry`, `graphql`, `@graphql-typed-document-node/core`, `@graphql-codegen/*`. Update scripts (drop `codegen`). |
| `packages/anticapture-client/src/anticapture-client.ts` | Constructor accepts a config object. Each method delegates to `@anticapture/client`. Retain fan-out, fail-soft, sort, address normalization. New `withRetryAndTimeout` helper used internally. |
| `packages/anticapture-client/src/schemas.ts` | Drop `Safe*ResponseSchema` Zod schemas. Keep `processProposals`, `processVotingPowerHistory`, `ProcessedVotingPowerHistory` (adapted to SDK types). Keep `FeedEventType`, `FeedRelevance`, `OffchainProposalItem`, `OffchainVoteItem` as plain types (or aliased from SDK). |
| `packages/anticapture-client/src/index.ts` | Re-export the same names as today. Add aliases for any enum (`OrderDirection`, `QueryInput_Proposals_Status_Items`, etc.) that callers import. |
| `packages/anticapture-client/tests/anticapture-client.test.ts` | Rewrite using MSW (already a devDep). Test the same behaviors: empty response, fail-soft on errors, multi-DAO fan-out, global sort. |
| `packages/anticapture-client/tests/offchain-proposal.test.ts` | Update MSW handlers to intercept REST endpoints instead of POST `/graphql`. |
| `packages/anticapture-client/tests/test-helpers.ts` | Drop axios; expose helpers to construct an `AnticaptureClient` for tests + REST response builders. |
| `packages/anticapture-client/tsconfig.json` | Adjust if required by removing `gql/` from include. |
| `apps/logic-system/src/app.ts` | Update `new AnticaptureClient(anticaptureHttpClient)` call site. |
| `apps/logic-system/src/index.ts` | Update how the AnticaptureClient is constructed (drop axios.create wrapping). |
| `apps/dispatcher/src/app.ts` | Same update; remove the `axios.create({ baseURL: ... })` for anticapture. |
| `apps/dispatcher/src/index.ts` | Same. |
| `apps/consumers/src/app.ts` | Same. |
| `apps/consumers/src/index.ts` | Same. |
| `apps/logic-system/tests/offchain-vote-cast-trigger.test.ts:19` | Update the `new AnticaptureClient(axios.create())` call. |

### Files deleted

| Path | Reason |
|---|---|
| `packages/anticapture-client/queries/*.graphql` | GraphQL queries no longer used. |
| `packages/anticapture-client/codegen.yaml` | GraphQL codegen no longer used. |
| `packages/anticapture-client/src/gql/` (folder) | Generated GraphQL artifacts. |
| `packages/anticapture-client/.env`, `.env.local` (only the `ANTICAPTURE_GRAPHQL_ENDPOINT` reference if scoped to codegen) | If files are only for codegen, delete; otherwise leave. Verify before deleting. |

### Files NOT touched (must stay unchanged — this is the success criterion)

- Any repository in `apps/*/src/repositories/`
- Any trigger/service in `apps/*/src/triggers/` and `apps/*/src/services/`
- Any test in `apps/*/...test.ts` **except** `apps/logic-system/tests/offchain-vote-cast-trigger.test.ts:19` and `apps/consumers/src/services/dao/slack-dao.service.test.ts` (only if its mocks reference removed types)
- `apps/integrated-tests/src/mocks/graphql-mock-setup.ts` — the integrated-tests still use the existing GraphQL mock; **deferred** to a follow-up PR. We will need to either delete this file (and any tests that depend on it) OR keep the GraphQL endpoint working alongside REST. Resolved in **Task 0**.

---

## Task 0: Spike — Inspect the real `@anticapture/client` API & confirm assumptions

This task is research, no code committed beyond a small demo file. Goal: validate the spec's assumptions before writing migration code.

**Files:**
- Create (temporarily): `packages/anticapture-client/scripts/spike.ts` — a one-off TypeScript file that imports the SDK and prints types. Delete at end of task.

- [ ] **Step 1: Install the SDK locally to inspect it**

```bash
cd packages/anticapture-client
pnpm add @anticapture/client
```

Expected: package added to `dependencies`. `pnpm-lock.yaml` updated.

- [ ] **Step 2: Write a spike file that imports key symbols**

Create `packages/anticapture-client/scripts/spike.ts`:

```ts
import * as sdk from '@anticapture/client';

// Verify these exist:
console.log('exports:', Object.keys(sdk).sort());

// Try to import enums that callers use today:
// import { OrderDirection } from '@anticapture/client';
// import type { OnchainProposal } from '@anticapture/client';
```

- [ ] **Step 3: Verify SDK API in node_modules**

Run:

```bash
ls node_modules/@anticapture/client/dist/
cat node_modules/@anticapture/client/dist/index.d.ts | head -100
```

Expected output: list of exports. Look for and confirm:
- `daos`, `proposal` or `getProposal`, `proposals`, `votes`, `historicalVotingPower`, `proposalNonVoters`, `offchainProposalNonVoters`, `getEventRelevanceThreshold`, `offchainProposals`, `votesOffchain`
- `setClientConfig` function and its parameter shape
- Enums: `OrderDirection`, `QueryInput_Votes_OrderBy`, `QueryInput_VotesOffchain_OrderBy`, `QueryInput_Proposals_Status_Items` — or whatever Kubb names them
- Type names: `OnchainProposal`, `OffchainProposal`, etc.

- [ ] **Step 4: Document findings**

Append a `## SDK Surface (verified 2026-04-30)` section to `docs/superpowers/specs/2026-04-30-anticapture-client-sdk-migration-design.md` listing:
- The exact name of each function used by the wrapper.
- The exact shape of `setClientConfig`.
- The exact name of each enum/type the wrapper re-exports today.
- Any unexpected differences (e.g. enum value casing changed from `Asc` to `asc`).

- [ ] **Step 5: Decide enum/type re-export strategy**

Update spec section "Risks and mitigations" to specify, per import name used by callers, whether the wrapper:
- (a) re-exports SDK's symbol with the same name, or
- (b) creates an alias (`export { Foo as QueryInput_Votes_OrderBy } from '@anticapture/client';`), or
- (c) creates a local type/enum mirroring the GraphQL shape (last resort).

Record decisions in the spec.

- [ ] **Step 6: Verify integrated-tests dependency**

Run:

```bash
grep -rn "graphql-mock-setup" apps/integrated-tests/
```

Decide: does this PR delete `graphql-mock-setup.ts` and its tests, or do we leave them with a `.skip` annotation? Recommended: skip the affected integrated-tests in this PR with a TODO and tackle them in the MSW migration PR (separate). Record decision in the spec.

- [ ] **Step 7: Commit findings only (delete the spike file)**

```bash
rm packages/anticapture-client/scripts/spike.ts
git add packages/anticapture-client/package.json packages/anticapture-client/pnpm-lock.yaml docs/superpowers/specs/2026-04-30-anticapture-client-sdk-migration-design.md
# (or just commit at the repo root with the relevant files)
git commit -m "chore(anticapture-client): add @anticapture/client dep, document SDK surface"
```

**Definition of done:** Spec updated with concrete SDK surface. SDK is installed in `packages/anticapture-client/`. No source code changed yet.

---

## Task 1: Add `withRetryAndTimeout` helper

Adds a single small helper that wraps an SDK call with retry + timeout. No new dependency.

**Files:**
- Create: `packages/anticapture-client/src/with-retry-and-timeout.ts`
- Test: `packages/anticapture-client/tests/with-retry-and-timeout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/with-retry-and-timeout.test.ts`:

```ts
import { describe, it, expect, jest } from '@jest/globals';
import { withRetryAndTimeout } from '../src/with-retry-and-timeout';

describe('withRetryAndTimeout', () => {
  it('returns the result on first success', async () => {
    const fn = jest.fn<() => Promise<number>>().mockResolvedValue(42);
    const result = await withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000 });
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on network/server errors and eventually succeeds', async () => {
    const fn = jest.fn<() => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error('500'), { status: 500 }))
      .mockRejectedValueOnce(Object.assign(new Error('502'), { status: 502 }))
      .mockResolvedValue('ok');
    const result = await withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx', async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(
      Object.assign(new Error('400'), { status: 400 })
    );
    await expect(withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000 }))
      .rejects.toThrow('400');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const fn = jest.fn<() => Promise<string>>().mockRejectedValue(
      Object.assign(new Error('500'), { status: 500 })
    );
    await expect(withRetryAndTimeout(fn, { retries: 2, timeoutMs: 1000, baseDelayMs: 1 }))
      .rejects.toThrow('500');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('aborts and throws on timeout', async () => {
    const fn = jest.fn((signal?: AbortSignal) => new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    await expect(withRetryAndTimeout(fn, { retries: 0, timeoutMs: 10 }))
      .rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @notification-system/anticapture-client test -- with-retry-and-timeout`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

Create `src/with-retry-and-timeout.ts`:

```ts
export interface RetryOptions {
  retries: number;
  timeoutMs: number;
  baseDelayMs?: number; // default 1000
}

function isRetryable(err: unknown): boolean {
  const e = err as { status?: number; code?: string };
  if (!e) return false;
  if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ENETUNREACH') return true;
  if (typeof e.status === 'number' && e.status >= 500) return true;
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetryAndTimeout<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { retries, timeoutMs, baseDelayMs = 1000 } = opts;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      return await fn(ac.signal);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === retries) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`[AnticaptureClient] Retry ${attempt + 1}/${retries} after error: ${(err as Error).message}`);
      await sleep(delay);
      attempt += 1;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
```

- [ ] **Step 4: Run tests until they pass**

Run: `pnpm --filter @notification-system/anticapture-client test -- with-retry-and-timeout`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/anticapture-client/src/with-retry-and-timeout.ts packages/anticapture-client/tests/with-retry-and-timeout.test.ts
git commit -m "feat(anticapture-client): add withRetryAndTimeout helper"
```

---

## Task 2: Rewrite `AnticaptureClient` constructor and `getDAOs` (using SDK)

This is the foundational task: it establishes the new constructor shape and the simplest method (no fan-out). We do this method first because every other method depends on `getDAOs` for fan-out.

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts` (only the `getDAOs` block + setup)
- Modify: `packages/anticapture-client/tests/test-helpers.ts`

- [ ] **Step 1: Rewrite `test-helpers.ts` to use MSW**

Replace contents:

```ts
import { setupServer } from 'msw/node';
import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw';
import { AnticaptureClient } from '../src/anticapture-client';

export const TEST_BASE_URL = 'http://test-api';

export function startServer() {
  const server = setupServer();
  return server;
}

export function createTestClient() {
  return new AnticaptureClient({
    baseURL: TEST_BASE_URL,
    maxRetries: 0,        // disable retry in tests
    timeoutMs: 5000,
    defaultHeaders: { 'x-client-source': 'notification-system-test' },
  });
}

// Convenience builders for SDK response shapes
export function daosResponse(items: Array<{ id: string; votingDelay?: string; chainId?: number; supportOffchainData?: boolean; alreadySupportCalldataReview?: boolean }>) {
  return { items: items.map(d => ({
    id: d.id,
    votingDelay: d.votingDelay ?? '0',
    chainId: d.chainId ?? 1,
    supportOffchainData: d.supportOffchainData ?? false,
    alreadySupportCalldataReview: d.alreadySupportCalldataReview ?? false,
  })) };
}
```

- [ ] **Step 2: Write failing tests for `getDAOs` against MSW**

In `tests/anticapture-client.test.ts`, replace the `describe('getDAOs')` block with:

```ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { startServer, createTestClient, daosResponse, TEST_BASE_URL } from './test-helpers';

const server = startServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getDAOs', () => {
  it('returns empty array when API returns empty list', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([]))));
    const client = createTestClient();
    expect(await client.getDAOs()).toEqual([]);
  });

  it('maps DAOs adding hardcoded blockTime: 12', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
      daosResponse([
        { id: 'UNISWAP', votingDelay: '1000', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
        { id: 'ENS', votingDelay: '500', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
      ])
    )));
    const client = createTestClient();
    expect(await client.getDAOs()).toEqual([
      { id: 'UNISWAP', blockTime: 12, votingDelay: '1000', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
      { id: 'ENS', blockTime: 12, votingDelay: '500', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
    ]);
  });

  it('returns empty array when API returns 500', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.getDAOs()).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the tests to confirm they fail (compile error or wrong constructor)**

Run: `pnpm --filter @notification-system/anticapture-client test -- getDAOs`
Expected: FAIL (constructor signature mismatch).

- [ ] **Step 4: Rewrite `anticapture-client.ts` skeleton with new constructor**

Replace the file with this skeleton (will grow in subsequent tasks). Keep all old methods stubbed throwing `not migrated yet` to keep TS happy temporarily. **Important:** call `setClientConfig` in the constructor with the resolved config.

```ts
import { getAddress, isAddress } from 'viem';
import { setClientConfig, daos } from '@anticapture/client';
// NOTE: import-only. Each method will import what it needs.
import { withRetryAndTimeout } from './with-retry-and-timeout';

export interface AnticaptureClientConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  timeoutMs?: number;
}

export class AnticaptureClient {
  private readonly retries: number;
  private readonly timeoutMs: number;

  constructor(config: AnticaptureClientConfig) {
    this.retries = config.maxRetries ?? 4;
    this.timeoutMs = config.timeoutMs ?? 15000;

    setClientConfig({
      baseURL: config.baseURL,
      defaultHeaders: {
        'x-client-source': 'notification-system',
        ...config.defaultHeaders,
      },
    });
  }

  private async call<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    return withRetryAndTimeout(fn, { retries: this.retries, timeoutMs: this.timeoutMs });
  }

  // Address normalization helpers (unchanged from previous version) ----------
  private normalizeAddressesInObject(obj: any, transformer: (a: string) => string): any {
    if (obj == null) return obj;
    if (typeof obj === 'string') {
      try { return isAddress(obj) ? transformer(obj) : obj; } catch { return obj; }
    }
    if (Array.isArray(obj)) return obj.map(i => this.normalizeAddressesInObject(i, transformer));
    if (typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.normalizeAddressesInObject(v, transformer)]));
    }
    return obj;
  }
  private toChecksum(o: any) { return this.normalizeAddressesInObject(o, getAddress); }
  private toLowercase(o: any) { return this.normalizeAddressesInObject(o, a => a.toLowerCase()); }

  // ---- METHOD: getDAOs ----
  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string; chainId: number; alreadySupportCalldataReview: boolean; supportOffchainData: boolean }>> {
    try {
      const res = await this.call((signal) => daos({ signal }));
      const items = res.data?.items ?? [];
      return this.toLowercase(items.map(d => ({
        id: d.id,
        blockTime: 12,
        votingDelay: d.votingDelay ?? '0',
        chainId: d.chainId,
        alreadySupportCalldataReview: d.alreadySupportCalldataReview ?? false,
        supportOffchainData: d.supportOffchainData ?? false,
      })));
    } catch (err) {
      console.warn('Returning empty DAO list due to API error: ', err instanceof Error ? err.message : err);
      return [];
    }
  }

  // ---- All other methods stubbed (will be migrated next) ----
  async getProposalById(_id: string): Promise<any | null> { throw new Error('not migrated yet'); }
  async listProposals(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listVotingPowerHistory(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listVotes(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async getProposalNonVoters(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async getOffchainProposalNonVoters(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listRecentVotesFromAllDaos(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async getEventThreshold(..._args: any[]): Promise<string | null> { throw new Error('not migrated yet'); }
  async listOffchainProposals(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listOffchainVotes(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listRecentOffchainVotesFromAllDaos(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
}
```

> **Note:** The exact name of `daos` and the shape of `res.data` come from Task 0's findings. If different, adjust here.

- [ ] **Step 5: Run getDAOs tests**

Run: `pnpm --filter @notification-system/anticapture-client test -- getDAOs`
Expected: PASS, 3 tests.

- [ ] **Step 6: Run full package test suite — expect failures**

Run: `pnpm --filter @notification-system/anticapture-client test`
Expected: getDAOs tests pass; all other AnticaptureClient method tests fail (because methods are stubbed). This is acceptable mid-migration. **Skip the failing tests with `it.skip` for now**, leaving a TODO comment per skipped describe block referencing the next task that will re-enable them.

- [ ] **Step 7: Commit**

```bash
git add packages/anticapture-client/src packages/anticapture-client/tests
git commit -m "refactor(anticapture-client): rewrite constructor + getDAOs over @anticapture/client"
```

---

## Task 3: Migrate per-DAO simple methods (`getProposalById`, `getEventThreshold`, `listVotes`, `getProposalNonVoters`, `getOffchainProposalNonVoters`, `listOffchainVotes`)

These methods don't fan out and don't transform much. Migrate them as a group because each is small (~5 minutes).

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts` (replace stubs)
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts` (un-skip tests, adapt to MSW)

For **each** of the 6 methods, repeat this micro-cycle:

- [ ] **Sub-step A: Un-skip and rewrite the test for the method using MSW**

Example pattern for `getEventThreshold`:

```ts
describe('getEventThreshold', () => {
  it('returns threshold string', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ENS/event-relevance/threshold`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get('type')).toBe('Delegation');
      expect(url.searchParams.get('relevance')).toBe('high');
      return HttpResponse.json({ threshold: '40000000000000000000000' });
    }));
    const client = createTestClient();
    const result = await client.getEventThreshold('ENS', FeedEventType.Delegation, FeedRelevance.High);
    expect(result).toBe('40000000000000000000000');
  });

  it('returns null on error', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ENS/event-relevance/threshold`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.getEventThreshold('ENS', FeedEventType.Vote, FeedRelevance.High)).toBeNull();
  });
});
```

Apply the same pattern to:
- `getProposalById` (GET `/{dao}/proposals/{id}` — but per the existing API it's by ID without dao? **Verify with Task 0**. If dao is now required, the public method signature must keep `(id)` and the implementation has to **iterate DAOs to find the proposal** — preserving today's contract. Document this discovery.)
- `listVotes(daoId, variables)` — GET `/{dao}/votes`
- `getProposalNonVoters(proposalId, daoId, addresses?)` — GET `/{dao}/proposals/{id}/non-voters`
- `getOffchainProposalNonVoters(proposalId, addresses?)` — needs a daoId in REST. **Today's signature does not take daoId.** Check Task 0; we may need to also iterate DAOs here. Document.
- `listOffchainVotes(daoId, variables?)` — GET `/{dao}/offchain/votes` (verify path)

- [ ] **Sub-step B: Replace the stub in `anticapture-client.ts`**

For example, `getEventThreshold`:

```ts
import { getEventRelevanceThreshold } from '@anticapture/client';

async getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null> {
  try {
    const res = await this.call((signal) =>
      getEventRelevanceThreshold(daoId, { type, relevance }, { signal })
    );
    return res.data?.threshold ?? null;
  } catch (err) {
    console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
```

Apply checksum/lowercase normalization to inputs/outputs at the same boundary as today.

- [ ] **Sub-step C: Run that method's tests**

Run: `pnpm --filter @notification-system/anticapture-client test -- <methodName>`
Expected: PASS.

- [ ] **Sub-step D: Commit per method**

```bash
git add packages/anticapture-client/src/anticapture-client.ts packages/anticapture-client/tests/anticapture-client.test.ts
git commit -m "refactor(anticapture-client): migrate <methodName> to @anticapture/client"
```

> **Granularity note:** If a method requires non-trivial adapter code (e.g., handling missing daoId in `getOffchainProposalNonVoters`), break it into its own task with its own A→D cycle.

**Definition of done:** All 6 methods migrated. Each has at least one happy-path test and one error-path test. Each method commit was verified green before moving on.

---

## Task 4: Migrate `listProposals` (per-DAO + multi-DAO fan-out + sort)

This is the first complex method. It is the template for the rest of the fan-out methods.

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts`

- [ ] **Step 1: Un-skip and rewrite the per-DAO tests with MSW**

```ts
describe('listProposals (per-DAO)', () => {
  it('returns empty array for empty response', async () => {
    server.use(http.get(`${TEST_BASE_URL}/UNISWAP/proposals`, () =>
      HttpResponse.json({ items: [], totalCount: 0 })
    ));
    const client = createTestClient();
    expect(await client.listProposals({}, 'UNISWAP')).toEqual([]);
  });

  it('attaches daoId to each proposal', async () => {
    server.use(http.get(`${TEST_BASE_URL}/UNISWAP/proposals`, () =>
      HttpResponse.json({ items: [
        { id: 'p1', description: 'Proposal 1', title: null, timestamp: 100 }
      ], totalCount: 1 })
    ));
    const client = createTestClient();
    const result = await client.listProposals({}, 'UNISWAP');
    expect(result).toEqual([
      { id: 'p1', description: 'Proposal 1', title: null, timestamp: 100, daoId: 'UNISWAP' }
    ]);
  });
});
```

- [ ] **Step 2: Un-skip and rewrite the multi-DAO tests with MSW**

```ts
describe('listProposals (multi-DAO)', () => {
  beforeEach(() => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () =>
      HttpResponse.json(daosResponse([
        { id: 'DAO1' }, { id: 'DAO2' }, { id: 'DAO3' }
      ]))
    ));
  });

  it('continues processing when one DAO fails', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/DAO1/proposals`, () =>
        HttpResponse.json({ items: [{ id: 'p1', description: 'Proposal 1', title: null, timestamp: 200 }], totalCount: 1 })),
      http.get(`${TEST_BASE_URL}/DAO2/proposals`, () => new HttpResponse(null, { status: 500 })),
      http.get(`${TEST_BASE_URL}/DAO3/proposals`, () =>
        HttpResponse.json({ items: [{ id: 'p3', description: 'Proposal 3', title: null, timestamp: 300 }], totalCount: 1 })),
    );
    const client = createTestClient();
    const result = await client.listProposals();
    expect(result.map((p: any) => p.id)).toEqual(['p3', 'p1']); // sorted desc by timestamp
  });

  it('sorts globally by timestamp DESC', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/DAO1/proposals`, () => HttpResponse.json({ items: [{ id: 'old', timestamp: 1000, description: '', title: null }], totalCount: 1 })),
      http.get(`${TEST_BASE_URL}/DAO2/proposals`, () => HttpResponse.json({ items: [{ id: 'newest', timestamp: 3000, description: '', title: null }], totalCount: 1 })),
      http.get(`${TEST_BASE_URL}/DAO3/proposals`, () => HttpResponse.json({ items: [{ id: 'middle', timestamp: 2000, description: '', title: null }], totalCount: 1 })),
    );
    const client = createTestClient();
    const result = await client.listProposals();
    expect(result.map((p: any) => p.id)).toEqual(['newest', 'middle', 'old']);
  });
});
```

- [ ] **Step 3: Implement `listProposals`**

Replace the stub:

```ts
import { proposals as fetchProposals } from '@anticapture/client';
import { processProposals } from './schemas';

async listProposals(variables?: any, daoId?: string): Promise<any[]> {
  if (daoId) {
    try {
      const res = await this.call((signal) => fetchProposals(daoId, this.toChecksum(variables ?? {}), { signal }));
      return this.toLowercase(processProposals({ proposals: res.data }, daoId)) ?? [];
    } catch (err) {
      console.warn(`Error querying proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  const allDaos = await this.getDAOs();
  const all: any[] = [];
  for (const dao of allDaos) {
    try {
      const res = await this.call((signal) => fetchProposals(dao.id, this.toChecksum(variables ?? {}), { signal }));
      const processed = processProposals({ proposals: res.data }, dao.id);
      if (processed?.length) all.push(...processed);
    } catch (err) {
      console.warn(`Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (variables?.fromEndDate) {
    all.sort((a: any, b: any) => (b?.endTimestamp ?? 0) - (a?.endTimestamp ?? 0));
  } else {
    all.sort((a: any, b: any) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
  }
  return this.toLowercase(all);
}
```

> **Note:** `processProposals` from `schemas.ts` may need a small adapter signature change. Adjust together.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @notification-system/anticapture-client test -- listProposals`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(anticapture-client): migrate listProposals (per-DAO + fan-out)"
```

---

## Task 5: Migrate `listVotingPowerHistory` (fan-out + chainId attached + transformations)

Similar shape to Task 4, but uses `processVotingPowerHistory` and attaches `chainId` per DAO.

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts`

- [ ] **Step 1: Write tests for the per-DAO and fan-out paths (un-skip existing)**

Mirror the existing `listVotingPowerHistory` describe block in the current test file, switching to MSW.

- [ ] **Step 2: Implement using `historicalVotingPower` from SDK + `processVotingPowerHistory` from schemas**

```ts
import { historicalVotingPower } from '@anticapture/client';
import { processVotingPowerHistory, ProcessedVotingPowerHistory } from './schemas';

async listVotingPowerHistory(variables?: any, daoId?: string): Promise<ProcessedVotingPowerHistory[]> {
  if (daoId) {
    try {
      const res = await this.call(s => historicalVotingPower(daoId, this.toChecksum(variables ?? {}), { signal: s }));
      return this.toLowercase(processVotingPowerHistory({ historicalVotingPower: res.data }, daoId));
    } catch (err) {
      console.warn(`Error querying voting power history for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  const allDaos = await this.getDAOs();
  const promises = allDaos.map(async (dao) => {
    try {
      const res = await this.call(s => historicalVotingPower(dao.id, this.toChecksum(variables ?? {}), { signal: s }));
      return processVotingPowerHistory({ historicalVotingPower: res.data }, dao.id, dao.chainId);
    } catch (err) {
      console.warn(`Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  });
  const results = await Promise.all(promises);
  return this.toLowercase(
    results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
  );
}
```

- [ ] **Step 3: Run tests, ensure pass**

Run: `pnpm --filter @notification-system/anticapture-client test -- listVotingPowerHistory`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(anticapture-client): migrate listVotingPowerHistory"
```

---

## Task 6: Migrate `listRecentVotesFromAllDaos` and `listRecentOffchainVotesFromAllDaos`

Both fan out from `getDAOs()`, attach `daoId` to each result, sort by timestamp ASC.

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts`

- [ ] **Step 1: Write tests for both methods**

Use MSW to mock `/{dao}/votes` and `/{dao}/offchain/votes` (verify path in Task 0). Verify:
- All-DAOs fan-out works
- Per-DAO failures are skipped
- Offchain version filters DAOs without `supportOffchainData: true`
- Result is sorted ASC by timestamp / created

- [ ] **Step 2: Implement both methods**

For `listRecentVotesFromAllDaos`:

```ts
async listRecentVotesFromAllDaos(timestampGt: string, limit: number = 100): Promise<VoteWithDaoId[]> {
  const allDaos = await this.getDAOs();
  const promises = allDaos.map(async (dao) => {
    try {
      const votes = await this.listVotes(dao.id, {
        fromDate: parseInt(timestampGt), limit,
        orderBy: 'timestamp', orderDirection: 'asc',
      });
      return votes.map(v => ({ ...v, daoId: dao.id }));
    } catch (err) {
      console.warn(`Failed to fetch votes for DAO ${dao.id}:`, err);
      return [];
    }
  });
  const arrays = await Promise.all(promises);
  return arrays.flat().sort((a, b) => a.timestamp - b.timestamp);
}
```

For `listRecentOffchainVotesFromAllDaos`: same shape, but filter `dao.supportOffchainData === true`.

- [ ] **Step 3: Run tests, ensure pass**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(anticapture-client): migrate listRecentVotesFromAllDaos + offchain"
```

---

## Task 7: Migrate `listOffchainProposals` (fan-out + `supportOffchainData` filter)

**Files:**
- Modify: `packages/anticapture-client/src/anticapture-client.ts`
- Modify: `packages/anticapture-client/tests/anticapture-client.test.ts` and `tests/offchain-proposal.test.ts`

- [ ] **Step 1: Rewrite `tests/offchain-proposal.test.ts` to use REST endpoints under MSW**

Replace the GraphQL handler with REST handlers:
- `GET /daos` → DAOs list (with `supportOffchainData`)
- `GET /{dao}/offchain/proposals` → proposals per DAO (verify exact path in Task 0)

Tests to keep: empty result, attaches `daoId`, multi-DAO fan-out, skip DAOs without `supportOffchainData`, fail-soft.

- [ ] **Step 2: Implement `listOffchainProposals`**

```ts
import { offchainProposals } from '@anticapture/client';

async listOffchainProposals(variables?: any, daoId?: string): Promise<(OffchainProposalItem & { daoId: string })[]> {
  if (daoId) {
    try {
      const res = await this.call(s => offchainProposals(daoId, this.toChecksum(variables ?? {}), { signal: s }));
      const items = res.data?.items ?? [];
      return this.toLowercase(items.map((i: any) => ({ ...i, daoId })));
    } catch (err) {
      console.warn(`Error querying offchain proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  const allDaos = await this.getDAOs();
  const all: any[] = [];
  for (const dao of allDaos) {
    if (!dao.supportOffchainData) continue;
    try {
      const res = await this.call(s => offchainProposals(dao.id, this.toChecksum(variables ?? {}), { signal: s }));
      const items = (res.data?.items ?? []).map((i: any) => ({ ...i, daoId: dao.id }));
      if (items.length) all.push(...items);
    } catch (err) {
      console.warn(`Skipping offchain proposals for ${dao.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  all.sort((a, b) => b.created - a.created);
  return this.toLowercase(all);
}
```

- [ ] **Step 3: Run tests, ensure pass**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(anticapture-client): migrate listOffchainProposals"
```

---

## Task 8: Clean up `schemas.ts`

Now that all methods consume SDK types directly, the Zod `Safe*ResponseSchema` validators are unused.

**Files:**
- Modify: `packages/anticapture-client/src/schemas.ts`

- [ ] **Step 1: Run usage scan**

```bash
grep -rn "Safe.*ResponseSchema\|EventThresholdResponseSchema\|OffchainProposalItemSchema\|OffchainVoteItemSchema\|HistoricalVotingPowerItemSchema" packages/anticapture-client/src
```

Expected: only references inside `schemas.ts` itself. If any other file still references one, fix the consumer first.

- [ ] **Step 2: Delete the unused Zod schemas**

Remove all `Safe*ResponseSchema`, `OffchainProposalItemSchema`, `OffchainVoteItemSchema`, `HistoricalVotingPowerItemSchema`, `EventThresholdResponseSchema` exports.

Keep:
- `FeedEventType`, `FeedRelevance` (re-exported from SDK or defined locally — verify with Task 0)
- `processProposals`, `processVotingPowerHistory`
- `ProcessedVotingPowerHistory` type
- `OffchainProposalItem`, `OffchainVoteItem` — if used by callers, alias from SDK or define as plain TS types matching SDK shapes.

- [ ] **Step 3: Adapt `processProposals` and `processVotingPowerHistory` signatures**

If they still expect Zod-validated input shapes, change them to accept the raw SDK response. Update tests in `tests/anticapture-client.test.ts` if needed.

- [ ] **Step 4: Run full package suite**

Run: `pnpm --filter @notification-system/anticapture-client test`
Expected: ALL tests pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(anticapture-client): drop unused Zod schemas, keep transform helpers"
```

---

## Task 9: Update `src/index.ts` re-exports

**Files:**
- Modify: `packages/anticapture-client/src/index.ts`

- [ ] **Step 1: Audit caller imports**

```bash
grep -rn "from '@notification-system/anticapture-client'" apps/ | grep -v node_modules | grep -v dist
```

Note **every named import** that callers use today: `AnticaptureClient`, `VoteWithDaoId`, `OffchainVoteWithDaoId`, `GetDaOsQuery`, `GetProposalByIdQuery`, `GetProposalByIdQueryVariables`, `ListProposalsQuery`, `ListProposalsQueryVariables`, `ListVotesQuery`, `ListVotesQueryVariables`, `ListHistoricalVotingPowerQuery`, `ListHistoricalVotingPowerQueryVariables`, `OrderDirection`, `QueryInput_HistoricalVotingPower_OrderBy`, `QueryInput_Votes_OrderBy`, `QueryInput_VotesOffchain_OrderBy`, `QueryInput_Proposals_Status_Items`, `FeedEventType`, `FeedRelevance`, `ProcessedVotingPowerHistory`, `OffchainProposalItem`, `OffchainVoteItem`.

- [ ] **Step 2: Re-export all of the above from `index.ts`**

For each, decide using Task 0's findings:
- If SDK already exports the same name → re-export.
- If SDK exports a different name → alias: `export { Foo as OriginalName } from '@anticapture/client';`
- If SDK doesn't expose it (e.g. `*Query` GraphQL types) → define a local TS type matching the shape callers expect, OR remove the export if no caller actually uses the GraphQL-only types in their **source** code (only in their test mocks).

- [ ] **Step 3: Type-check the package**

```bash
pnpm --filter @notification-system/anticapture-client run build
```

Expected: succeeds with no TS errors.

- [ ] **Step 4: Type-check entire repo**

```bash
pnpm -r run build  # or whatever the monorepo type-check command is — verify in turbo.json
```

Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(anticapture-client): align index re-exports with new SDK"
```

---

## Task 10: Update the 3 `app.ts` constructor calls + `index.ts` boot files

The constructor signature changed. Update the 3 apps.

**Files:**
- Modify: `apps/logic-system/src/app.ts`
- Modify: `apps/logic-system/src/index.ts`
- Modify: `apps/dispatcher/src/app.ts`
- Modify: `apps/dispatcher/src/index.ts`
- Modify: `apps/consumers/src/app.ts`
- Modify: `apps/consumers/src/index.ts`

Pattern for each app:

- [ ] **Step 1: For logic-system**

In `apps/logic-system/src/index.ts`, remove the `axios.create({ baseURL })` wrapper for the anticapture client. Pass the URL directly to the `App` constructor.

In `apps/logic-system/src/app.ts:43,49`, change:
```ts
constructor(triggerInterval: number, proposalStatus, anticaptureHttpClient: AxiosInstance, ...)
// ...
const anticaptureClient = wrapWithTracing(new AnticaptureClient(anticaptureHttpClient));
```
to:
```ts
constructor(triggerInterval: number, proposalStatus, anticaptureBaseURL: string, anticaptureHeaders: Record<string,string>, ...)
// ...
const anticaptureClient = wrapWithTracing(new AnticaptureClient({
  baseURL: anticaptureBaseURL,
  defaultHeaders: anticaptureHeaders,
}));
```

- [ ] **Step 2: For dispatcher**

Same shape as logic-system. The dispatcher constructor takes `anticaptureGraphqlEndpoint: string` already; rename to `anticaptureBaseURL` and pass it through. Drop `anticaptureHttpClient?: any` parameter.

- [ ] **Step 3: For consumers**

Same shape. `apps/consumers/src/index.ts` currently does `axios.create({ baseURL: ... })` — drop it; pass `config.anticaptureGraphqlEndpoint` directly.

- [ ] **Step 4: Update test that constructs `AnticaptureClient` directly**

`apps/logic-system/tests/offchain-vote-cast-trigger.test.ts:19`:
```ts
super(new AnticaptureClient({ baseURL: 'http://localhost' }));
```

Verify no other test does this with `grep`.

- [ ] **Step 5: Run all unit tests**

```bash
pnpm -r test
```

Expected: every test in every app passes (since the public API to repositories has not changed).

- [ ] **Step 6: Type-check**

```bash
pnpm -r run build
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git commit -am "refactor: update apps to construct AnticaptureClient with config object"
```

---

## Task 11: Delete GraphQL artifacts and remove unused dependencies

**Files:**
- Delete: `packages/anticapture-client/queries/` (entire folder)
- Delete: `packages/anticapture-client/codegen.yaml`
- Delete: `packages/anticapture-client/src/gql/` (entire folder)
- Modify: `packages/anticapture-client/package.json`
- Modify: `packages/anticapture-client/tsconfig.json` (if `gql/` was in `include`)

- [ ] **Step 1: Delete files**

```bash
rm -rf packages/anticapture-client/queries packages/anticapture-client/src/gql
rm packages/anticapture-client/codegen.yaml
```

- [ ] **Step 2: Update `package.json`**

Remove from `dependencies`:
- `axios`
- `axios-retry`
- `graphql`
- `@graphql-typed-document-node/core`

Remove from `devDependencies`:
- `@graphql-codegen/cli`
- `@graphql-codegen/client-preset`
- `@graphql-codegen/typescript`
- `@graphql-codegen/typescript-operations`
- `dotenv-cli` (only if unused elsewhere — check)

Remove the `codegen` script.

- [ ] **Step 3: Reinstall**

```bash
pnpm install
```

Expected: lockfile updated, `node_modules/@graphql-codegen` etc. gone.

- [ ] **Step 4: Build and test**

```bash
pnpm --filter @notification-system/anticapture-client run build
pnpm --filter @notification-system/anticapture-client test
```

Both expected to pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "chore(anticapture-client): drop GraphQL codegen and unused deps"
```

---

## Task 12: Address integrated-tests fallout

`apps/integrated-tests/src/mocks/graphql-mock-setup.ts` mocks GraphQL POSTs. This will no longer work because the wrapper no longer makes GraphQL POSTs.

**Files:**
- Decision per Task 0 (already documented in spec).

If the decision was "skip integrated-tests in this PR":

- [ ] **Step 1: Add `it.skip` (or `describe.skip`) to every integrated-test that uses GraphQL mocks**

Run:
```bash
grep -rn "graphql-mock-setup\|GraphQLMockSetup" apps/integrated-tests/
```

Add a TODO comment referencing the future MSW migration ticket.

- [ ] **Step 2: Run integrated-tests to confirm all pass (skipped count > 0)**

```bash
pnpm --filter integrated-tests test
```

- [ ] **Step 3: Commit**

```bash
git commit -am "test(integrated-tests): skip GraphQL-mock-based tests pending MSW migration"
```

If the decision was "delete and replace": follow the corresponding sub-plan documented in the spec.

---

## Task 13: Smoke test against real Gateful API

Manual verification.

- [ ] **Step 1: Run logic-system locally against staging Gateful**

```bash
ANTICAPTURE_GRAPHQL_ENDPOINT=https://api.gateful.staging.example pnpm --filter logic-system dev
```

(Use the project's actual env file pattern — `.env.example`.)

Expected: triggers fire, proposals/votes/voting-power events get processed, RabbitMQ messages are published.

- [ ] **Step 2: Run dispatcher and consumers locally**

Same approach.

- [ ] **Step 3: Inspect logs for fail-soft behavior**

Force one DAO endpoint to fail (e.g., temporarily point one DAO's `proposals` route to a 500 via local proxy or by editing the wrapper to simulate). Confirm: other DAOs still produce proposals, the failure is logged as warn, no trigger crashes.

- [ ] **Step 4: Verify address casing in DB**

After a notification flows through, query the DB for one row and confirm the `daoId` and any voter addresses are lowercase as before.

- [ ] **Step 5: Document smoke results in the PR description**

No commit. Note the findings in the PR body when opening the PR.

---

## Task 14: Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin <branch>
```

- [ ] **Step 2: Open PR with description**

PR body should include:
- Link to the spec doc.
- Summary of changes (this list of tasks completed).
- Smoke test results from Task 13.
- Explicit out-of-scope note: MSW migration in non-package tests, address-normalization removal — both deferred.
- Verification: "no caller files outside `packages/anticapture-client/` and the 3 `app.ts` files were modified."

```bash
gh pr create --title "refactor(anticapture-client): migrate internals to @anticapture/client SDK" --body "$(cat <<'EOF'
## Summary
- Replace internal GraphQL transport with @anticapture/client REST SDK
- Public API of @notification-system/anticapture-client is unchanged
- Only consumer-visible diff: 3 app.ts constructor calls

## Out of scope (separate follow-up PRs)
- MSW migration for non-package tests
- Removal of address-normalization (pending verification of REST API behavior)

## Test plan
- [x] Package unit tests pass (MSW-based)
- [x] Repo type-check passes
- [x] Smoke test logic-system, dispatcher, consumers against staging
- [x] Verified fail-soft behavior on simulated DAO failure
- [x] Verified address casing in DB unchanged

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Skills referenced

- @superpowers:test-driven-development — for the inner write-test/implement/verify cycle in Tasks 1-7
- @superpowers:verification-before-completion — before marking each task complete
- @superpowers:requesting-code-review — when ready to merge
