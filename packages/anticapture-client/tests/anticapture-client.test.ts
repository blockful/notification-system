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
        { id: 'uniswap', votingDelay: '1000', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
        { id: 'ens', votingDelay: '500', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
      ])
    )));
    const client = createTestClient();
    expect(await client.getDAOs()).toEqual([
      { id: 'uniswap', blockTime: 12, votingDelay: '1000', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
      { id: 'ens', blockTime: 12, votingDelay: '500', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
    ]);
  });

  it('returns empty array when API returns 500', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.getDAOs()).toEqual([]);
  });
});

// TODO: Migrate in Task 3
describe.skip('getProposalById', () => {});

// TODO: Migrate in Task 3
describe.skip('getEventThreshold', () => {});

// TODO: Migrate in Task 4
describe.skip('listProposals', () => {});

// TODO: Migrate in Task 5
describe.skip('listVotingPowerHistory', () => {});
