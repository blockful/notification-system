import { describe, it, expect, afterEach, beforeAll, afterAll } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import axios from 'axios';

const TEST_API_URL = 'http://test-api/graphql';

interface OffchainProposalStub {
  id: string;
  title: string;
  discussion: string;
  state: string;
  created: number;
}

interface GraphQLScenario {
  daos: Array<{ id: string; votingDelay?: string; chainId?: number }>;
  proposals?: Record<string, OffchainProposalStub[]>;
  errors?: Record<string, string>;
}

function handleGraphQL(scenario: GraphQLScenario) {
  return http.post(TEST_API_URL, async ({ request }) => {
    const body = await request.json() as { query: string };

    if (body.query.includes('daos')) {
      return HttpResponse.json({
        data: {
          daos: {
            items: scenario.daos.map(d => ({
              id: d.id,
              votingDelay: d.votingDelay ?? '0',
              chainId: d.chainId ?? 1,
            })),
          },
        },
      });
    }

    const daoId = request.headers.get('anticapture-dao-id');

    if (daoId && scenario.errors?.[daoId]) {
      return HttpResponse.json({
        data: null,
        errors: [{ message: scenario.errors[daoId] }],
      });
    }

    const items = (daoId && scenario.proposals?.[daoId]) || [];
    return HttpResponse.json({
      data: {
        offchainProposals: { items, totalCount: items.length },
      },
    });
  });
}

describe('listOffchainProposals', () => {
  const server = setupServer();

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  function createRealClient() {
    const httpClient = axios.create({ baseURL: TEST_API_URL });
    return new AnticaptureClient(httpClient, 0, 5000);
  }

  it('returns empty array when no DAOs exist', async () => {
    server.use(handleGraphQL({ daos: [] }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toEqual([]);
  });

  it('returns proposals with daoId attached', async () => {
    server.use(handleGraphQL({
      daos: [{ id: 'ENS' }],
      proposals: {
        ENS: [{ id: 'snap-1', title: 'Test Proposal', discussion: 'https://forum.example.com', state: 'active', created: 1700000000 }],
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'snap-1', daoId: 'ENS' });
  });

  it('aggregates proposals from multiple DAOs', async () => {
    server.use(handleGraphQL({
      daos: [{ id: 'DAO_A' }, { id: 'DAO_B' }],
      proposals: {
        DAO_A: [{ id: 'snap-a', title: 'From A', discussion: '', state: 'active', created: 1700000100 }],
        DAO_B: [{ id: 'snap-b', title: 'From B', discussion: '', state: 'pending', created: 1700000200 }],
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['snap-b', 'snap-a']);
  });

  it('skips DAO on API error and continues with others', async () => {
    server.use(handleGraphQL({
      daos: [{ id: 'OK_DAO' }, { id: 'BAD_DAO' }],
      proposals: {
        OK_DAO: [{ id: 'snap-ok', title: 'OK', discussion: '', state: 'active', created: 1700000000 }],
      },
      errors: {
        BAD_DAO: 'API exploded',
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('snap-ok');
  });
});