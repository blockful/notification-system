import { describe, it, expect, afterEach, beforeAll, afterAll } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import axios from 'axios';

const TEST_API_URL = 'http://test-api/graphql';

interface OffchainProposalStub {
  id: string;
  spaceId?: string;
  author?: string;
  title: string;
  body?: string;
  discussion: string;
  type?: string;
  start?: number;
  link: string;
  state: string;
  created: number;
  updated?: number;
  flagged?: boolean;
  scores?: number[];
  choices?: string[];
  network?: string;
  snapshot?: number | null;
  strategies?: Array<{ name: string; network: string; params: Record<string, unknown> }>;
  end: number;
}

interface RestScenario {
  daos: Array<{ id: string; votingDelay?: string; chainId?: number; supportOffchainData?: boolean }>;
  proposals?: Record<string, OffchainProposalStub[]>;
  errors?: Record<string, string>;
}

function handleRest(scenario: RestScenario) {
  return [
    http.get('http://test-api/daos', () => {
      return HttpResponse.json({
        items: scenario.daos.map(d => ({
          id: d.id,
          chainId: d.chainId ?? 1,
          quorum: '0',
          proposalThreshold: '0',
          votingDelay: d.votingDelay ?? '0',
          votingPeriod: '0',
          timelockDelay: '0',
          alreadySupportCalldataReview: false,
          supportOffchainData: d.supportOffchainData ?? true,
        })),
        totalCount: scenario.daos.length,
      });
    }),
    http.get('http://test-api/:dao/offchain/proposals', ({ params }) => {
      const daoId = String(params.dao);

      if (scenario.errors?.[daoId.toUpperCase()] || scenario.errors?.[daoId]) {
        return new HttpResponse(null, { status: 500 });
      }

      const items = scenario.proposals?.[daoId.toUpperCase()] || scenario.proposals?.[daoId] || [];
      return HttpResponse.json({
        items: items.map(item => ({
          spaceId: 'space.eth',
          author: '0x1111111111111111111111111111111111111111',
          body: '',
          type: 'single-choice',
          start: item.created,
          updated: item.created,
          flagged: false,
          scores: [],
          choices: [],
          network: '1',
          snapshot: null,
          strategies: [],
          ...item,
        })),
        totalCount: items.length
      });
    })
  ];
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
    server.use(...handleRest({ daos: [] }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toEqual([]);
  });

  it('returns proposals with daoId attached', async () => {
    server.use(...handleRest({
      daos: [{ id: 'ens' }],
      proposals: {
        ENS: [{ id: 'snap-1', title: 'Test Proposal', discussion: 'https://forum.example.com', link: 'https://snapshot.org/snap-1', state: 'active', created: 1700000000, end: 1700086400 }],
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'snap-1', daoId: 'ENS' });
  });

  it('aggregates proposals from multiple DAOs', async () => {
    server.use(...handleRest({
      daos: [{ id: 'dao_a' }, { id: 'dao_b' }],
      proposals: {
        DAO_A: [{ id: 'snap-a', title: 'From A', discussion: '', link: '', state: 'active', created: 1700000100, end: 1700086500 }],
        DAO_B: [{ id: 'snap-b', title: 'From B', discussion: '', link: '', state: 'pending', created: 1700000200, end: 1700086600 }],
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(2);
    expect(result.map(p => p.id)).toEqual(['snap-b', 'snap-a']);
  });

  it('skips DAOs with supportOffchainData false', async () => {
    server.use(...handleRest({
      daos: [
        { id: 'onchain_only', supportOffchainData: false },
        { id: 'offchain_dao', supportOffchainData: true },
      ],
      proposals: {
        ONCHAIN_ONLY: [{ id: 'snap-should-not-appear', title: 'Should not appear', discussion: '', link: '', state: 'active', created: 1700000000, end: 1700086400 }],
        OFFCHAIN_DAO: [{ id: 'snap-ok', title: 'OK', discussion: '', link: '', state: 'active', created: 1700000100, end: 1700086500 }],
      },
    }));

    const client = createRealClient();
    const result = await client.listOffchainProposals();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('snap-ok');
    expect(result[0].daoId).toBe('OFFCHAIN_DAO');
  });

  it('skips DAO on API error and continues with others', async () => {
    server.use(...handleRest({
      daos: [{ id: 'ok_dao' }, { id: 'bad_dao' }],
      proposals: {
        OK_DAO: [{ id: 'snap-ok', title: 'OK', discussion: '', link: '', state: 'active', created: 1700000000, end: 1700086400 }],
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
