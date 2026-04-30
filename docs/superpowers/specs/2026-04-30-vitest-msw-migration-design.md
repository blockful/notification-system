# Vitest + MSW Migration Design

**Date:** 2026-04-30  
**Branch:** feat/anticapture_client  
**Status:** Approved

## Problem

All 25 integration test files are skipped with `describe.skip`. The comment on each reads:
> `// TODO: migrate to REST MSW mocks — graphql-mock-setup removed`

The tests previously used `GraphQLMockSetup.setupMock()` which mocked an axios-based HTTP client at the transport layer (intercepting GraphQL POST requests). After migrating to the `@anticapture/client` REST SDK, that mock strategy is misaligned — the SDK uses native `fetch`, not axios, and hits typed REST endpoints instead of GraphQL.

Additionally, `apps.ts` passes an axios mock object where app constructors now expect an `anticaptureBaseURL` string, meaning the test infrastructure is already broken at the injection point.

## Goals

1. Restore all 25 integration tests to a running (non-skipped) state.
2. Replace the axios/GraphQL mock layer with MSW (Mock Service Worker) intercepting REST fetch calls.
3. Migrate the test runner from Jest to Vitest.
4. Keep all existing infrastructure intact: TestContainers (RabbitMQ), SQLite, real in-process app instances.

## Architecture

### How tests currently work

```
Test → GraphQLMockSetup.setupMock(axiosMock) → axiosMock injected into App constructors
App makes GraphQL POST → axios mock intercepts → returns fake data
```

### How tests will work after migration

```
Test → server.use(mswHandler) → MSW intercepts fetch at Node.js level
App makes REST GET/POST to http://mock.anticapture.local → MSW intercepts → returns fake data
```

Apps are started in-process (same Node.js process as tests), so `msw/node`'s `setupServer` intercepts their fetch calls transparently.

---

## Part 1 — Anticapture repo: `@kubb/plugin-msw`

**Files changed:** `packages/anticapture-client/`

### 1.1 Install dependency

```
pnpm add -D @kubb/plugin-msw msw
```

### 1.2 Update `kubb.config.ts`

Add `pluginMsw` to the plugins array. Output target: `mocks.ts`. This auto-generates one MSW handler per API operation, covering all endpoints in the OpenAPI spec (`/{dao}/proposals`, `/{dao}/votes`, `/daos`, `/{dao}/offchain/proposals`, etc.).

```ts
import { pluginMsw } from '@kubb/plugin-msw'

// inside plugins array:
pluginMsw({
  output: { path: 'mocks.ts' },
})
```

### 1.3 Add `/mocks` package export

In `package.json`:

```json
"./mocks": {
  "types": "./dist/mocks.d.ts",
  "import": "./dist/mocks.js",
  "default": "./dist/mocks.js"
}
```

### 1.4 Rebuild

```
pnpm build
```

The generated `mocks.ts` exports one handler per operation (e.g. `proposalsHandler`, `votesHandler`, `daosHandler`, `offchainProposalsHandler`, etc.). Each handler returns an empty/passthrough response by default and can be overridden per-test with `server.use(http.get(...))`.

---

## Part 2 — Notification system: Vitest + MSW

### 2.1 Dependencies (`apps/integrated-tests/package.json`)

Remove:
- `jest`, `ts-jest`, `@types/jest`

Add:
- `vitest`
- `msw`

Remove `@jest/globals` imports throughout (Vitest exports the same API: `describe`, `test`, `expect`, `beforeAll`, `afterAll`, `beforeEach`, `vi`).

### 2.2 `vitest.config.ts` (replaces `jest.config.ts`)

Key differences from the old Jest config:
- **ESM support**: Vitest handles ESM natively — no `transformIgnorePatterns` workaround needed for `@anticapture/client`.
- **`globalSetup`**: Points to the same RabbitMQ container setup file (lightly adapted — no Jest-specific exports).
- **`setupFiles`**: Points to the new setup file (replaces `setupFilesAfterEach`).
- **`pool: 'forks'`**: Equivalent to Jest's `maxWorkers: 1` for sequential test execution.
- **`testTimeout: 120000`**: Preserved.

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    timeout: 120000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    globalSetup: './src/setup/vitest/global-setup.ts',
    setupFiles: ['./src/setup/vitest/setup.ts'],
  },
})
```

### 2.3 MSW server (`src/mocks/msw-server.ts`)

```ts
import { setupServer } from 'msw/node'
import * as handlers from '@anticapture/client/mocks'

export const server = setupServer(...Object.values(handlers))
```

The server is created once and shared across all tests. Individual tests call `server.use(overrideHandler)` for test-specific data.

### 2.4 Fix `apps.ts` — remove `mockHttpClient`

The `mockHttpClient` parameter is removed from `startTestApps`, `startConsumer`, `startDispatcher`, and `startLogicSystem`. Instead, all apps receive a fixed `anticaptureBaseURL`:

```ts
const MOCK_ANTICAPTURE_URL = 'http://mock.anticapture.local'
```

MSW intercepts all fetch calls to this origin. This matches what app constructors actually expect (a string URL, not an axios instance).

### 2.5 Global setup (`src/setup/vitest/global-setup.ts`)

Same logic as the old `jest-global-setup.ts` (starts RabbitMQ container, sets `process.env.TEST_RABBITMQ_URL`). Adapted to Vitest's export signature:

```ts
export async function setup() { /* start container */ }
export async function teardown() { /* stop container */ }
```

### 2.6 Setup file (`src/setup/vitest/setup.ts`)

Replaces `jest-setup-after-env.ts`. Key changes:

- Import `beforeAll`, `afterAll`, `beforeEach` from `vitest` (not `@jest/globals`).
- Start `server.listen()` before apps start.
- Call `server.resetHandlers()` in `beforeEach` to isolate test data.
- Stop `server.close()` in `afterAll`.
- Remove `HttpClientMockSetup` and `GraphQLMockSetup` usage.
- Pass `MOCK_ANTICAPTURE_URL` to `startTestApps` instead of a mock client.

### 2.7 `RestMockSetup` class (`src/mocks/rest-mock-setup.ts`)

Replaces `GraphQLMockSetup` with the same call-site shape:

```ts
RestMockSetup.setupMock({ proposals, votes, votingPower, daos, offchainProposals })
```

Internally calls `server.use(...)` with the appropriate MSW handler overrides for each data type. This minimises the diff in each test file — only the import and class name change, not the call structure.

### 2.8 Update 25 test files

For each test file:
1. Remove `describe.skip(` → `describe(`
2. Replace `import { ... } from '@jest/globals'` → `import { ... } from 'vitest'`
3. Replace `import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks'` → `import { RestMockSetup } from '../../src/mocks'`
4. Remove `let httpMockSetup: HttpClientMockSetup` declarations and assignments
5. Replace `GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), ...)` → `RestMockSetup.setupMock(...)`

### 2.9 Update `src/mocks/index.ts`

Export `RestMockSetup` and `server`. Remove `GraphQLMockSetup` export (or keep it deprecated if needed elsewhere).

### 2.10 Update `TestApps` type

Replace `jest.Mock` references with `vi.Mock` from `vitest`.

---

## Data flow: per-test mock override

```
beforeEach: server.resetHandlers()   ← clean slate each test

test('should send notification') {
  RestMockSetup.setupMock({
    proposals: [mockProposal],
    votes: [mockVote],
    daos: [{ id: 'test-dao', chainId: 1, ... }],
  })
  // trigger action (publish to RabbitMQ, etc.)
  // assert Telegram/Slack message received
}
```

---

## Files changed summary

### Anticapture repo (`packages/anticapture-client/`)
| File | Change |
|------|--------|
| `kubb.config.ts` | Add `pluginMsw` |
| `package.json` | Add `@kubb/plugin-msw` devDep + `/mocks` export |
| `generated/mocks.ts` | Auto-generated (new) |
| `dist/mocks.js` + `dist/mocks.d.ts` | Auto-generated (new) |

### Notification system (`apps/integrated-tests/`)
| File | Change |
|------|--------|
| `package.json` | Remove jest deps, add vitest + msw |
| `jest.config.ts` | Delete |
| `vitest.config.ts` | New |
| `src/setup/jest/*` | Delete or move |
| `src/setup/vitest/global-setup.ts` | New (adapted from jest-global-setup) |
| `src/setup/vitest/setup.ts` | New (adapted from jest-setup-after-env) |
| `src/mocks/msw-server.ts` | New |
| `src/mocks/rest-mock-setup.ts` | New (replaces GraphQLMockSetup) |
| `src/mocks/index.ts` | Update exports |
| `src/setup/services/apps.ts` | Remove mockHttpClient, use MOCK_ANTICAPTURE_URL |
| All 25 `tests/**/*.test.ts` | Remove skip, swap imports, swap mock calls |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `@kubb/plugin-msw` generated handler URL patterns may not match what `AnticaptureClient` calls | Verify with one test end-to-end before migrating all 25 |
| Vitest `globalSetup` vs Jest `globalSetup` — different teardown signature | Export named `setup`/`teardown` (Vitest convention) |
| Some tests may rely on Jest-specific mocking (`jest.fn()`, `jest.spyOn`) | Replace with `vi.fn()`, `vi.spyOn` — identical API |
| MSW handler order matters — more specific handlers must come before generic ones | `server.use()` prepends handlers, so per-test overrides always win |
