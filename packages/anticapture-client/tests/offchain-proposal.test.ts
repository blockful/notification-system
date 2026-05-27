import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { startServer, createTestClient, daosResponse, TEST_BASE_URL } from './test-helpers';

const server = startServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function offchainProposalsResponse(items: Array<{ id: string; title: string; created: number; end?: number }>) {
  return {
    items: items.map(p => ({
      id: p.id,
      title: p.title,
      discussion: '',
      link: '',
      state: 'active',
      created: p.created,
      end: p.end ?? p.created + 86400,
    })),
    totalCount: items.length,
  };
}

describe('listOffchainProposals', () => {
  it('returns empty array when no DAOs exist', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([]))));
    const client = createTestClient();
    expect(await client.listOffchainProposals()).toEqual([]);
  });

  it('returns empty array when no DAOs support offchain data', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([{ id: 'uniswap', supportOffchainData: false }])
      )),
    );
    const client = createTestClient();
    expect(await client.listOffchainProposals()).toEqual([]);
  });

  it('returns proposals with daoId attached', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([{ id: 'ens', supportOffchainData: true }])
      )),
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-1', title: 'Test Proposal', created: 1700000000 },
        ]))
      ),
    );
    const client = createTestClient();
    const result = await client.listOffchainProposals();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'snap-1', daoId: 'ens' });
  });

  it('aggregates proposals from multiple DAOs sorted DESC by created', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'dao_a', supportOffchainData: true },
          { id: 'dao_b', supportOffchainData: true },
        ])
      )),
      http.get(`${TEST_BASE_URL}/dao_a/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-a', title: 'From A', created: 1700000100 },
        ]))
      ),
      http.get(`${TEST_BASE_URL}/dao_b/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-b', title: 'From B', created: 1700000200 },
        ]))
      ),
    );
    const client = createTestClient();
    const result = await client.listOffchainProposals();
    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['snap-b', 'snap-a']); // sorted DESC by created
  });

  it('skips DAOs without supportOffchainData and queries only offchain-enabled ones', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'onchain_only', supportOffchainData: false },
          { id: 'offchain_dao', supportOffchainData: true },
        ])
      )),
      http.get(`${TEST_BASE_URL}/offchain_dao/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-ok', title: 'OK', created: 1700000100 },
        ]))
      ),
    );
    const client = createTestClient();
    const result = await client.listOffchainProposals();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('snap-ok');
    expect(result[0].daoId).toBe('offchain_dao');
  });

  it('skips DAO on API error and continues with others', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ok_dao', supportOffchainData: true },
          { id: 'bad_dao', supportOffchainData: true },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ok_dao/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-ok', title: 'OK', created: 1700000000 },
        ]))
      ),
      http.get(`${TEST_BASE_URL}/bad_dao/offchain/proposals`, () => new HttpResponse(null, { status: 500 })),
    );
    const client = createTestClient();
    const result = await client.listOffchainProposals();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('snap-ok');
  });

  it('returns proposals filtered by daoId when daoId is provided', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals`, () =>
        HttpResponse.json(offchainProposalsResponse([
          { id: 'snap-per-dao', title: 'Per DAO', created: 1700000000 },
        ]))
      ),
    );
    const client = createTestClient();
    const result = await client.listOffchainProposals({}, 'ens');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('snap-per-dao');
    expect(result[0].daoId).toBe('ens');
  });

  it('returns empty array on error when daoId is provided', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals`, () => new HttpResponse(null, { status: 500 })),
    );
    const client = createTestClient();
    expect(await client.listOffchainProposals({}, 'ens')).toEqual([]);
  });
});
