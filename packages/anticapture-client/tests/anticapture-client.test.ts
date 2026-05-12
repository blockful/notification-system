import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { startServer, createTestClient, daosResponse, TEST_BASE_URL } from './test-helpers';
import { FeedEventType, FeedRelevance } from '../src/schemas';

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

describe('getProposalById', () => {
  it('returns proposal from first matching DAO', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ens/proposals/prop-1`, () =>
        HttpResponse.json({ id: 'prop-1', description: 'Test proposal', title: 'Test' })
      ),
    );
    const client = createTestClient();
    const result = await client.getProposalById('prop-1');
    expect(result).not.toBeNull();
    expect(result.id).toBe('prop-1');
  });

  it('skips DAO on 404 and continues to next', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'uniswap', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/uniswap/proposals/prop-2`, () => new HttpResponse(null, { status: 404 })),
      http.get(`${TEST_BASE_URL}/ens/proposals/prop-2`, () =>
        HttpResponse.json({ id: 'prop-2', description: 'Found in ENS', title: 'ENS Proposal' })
      ),
    );
    const client = createTestClient();
    const result = await client.getProposalById('prop-2');
    expect(result).not.toBeNull();
    expect(result.id).toBe('prop-2');
  });

  it('returns null when no DAO has the proposal', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ens/proposals/missing-prop`, () => new HttpResponse(null, { status: 404 })),
    );
    const client = createTestClient();
    const result = await client.getProposalById('missing-prop');
    expect(result).toBeNull();
  });

  it('returns null when DAO list is empty', async () => {
    server.use(http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([]))));
    const client = createTestClient();
    expect(await client.getProposalById('any-prop')).toBeNull();
  });

  it('skips DAO on non-404 server error and continues to next DAO', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'uniswap', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/uniswap/proposals/prop-500`, () => new HttpResponse(null, { status: 500 })),
      http.get(`${TEST_BASE_URL}/ens/proposals/prop-500`, () =>
        HttpResponse.json({ id: 'prop-500', description: 'Found in ENS', title: 'ENS Proposal' })
      ),
    );
    const client = createTestClient();
    const result = await client.getProposalById('prop-500');
    expect(result).not.toBeNull();
    expect(result.id).toBe('prop-500');
  });
});

describe('getEventThreshold', () => {
  it('returns threshold string', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/event-relevance/threshold`, () =>
      HttpResponse.json({ threshold: '40000000000000000000000' })
    ));
    const client = createTestClient();
    const result = await client.getEventThreshold('ens', FeedEventType.Delegation, FeedRelevance.High);
    expect(result).toBe('40000000000000000000000');
  });

  it('returns null on error', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/event-relevance/threshold`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.getEventThreshold('ens', FeedEventType.Vote, FeedRelevance.High)).toBeNull();
  });
});

describe('listProposals', () => {
  describe('per-DAO', () => {
    it('returns empty array for empty response', async () => {
      server.use(http.get(`${TEST_BASE_URL}/uniswap/proposals`, () =>
        HttpResponse.json({ items: [], totalCount: 0 })
      ));
      const client = createTestClient();
      expect(await client.listProposals({}, 'uniswap')).toEqual([]);
    });

    it('attaches daoId to each proposal', async () => {
      server.use(http.get(`${TEST_BASE_URL}/uniswap/proposals`, () =>
        HttpResponse.json({ items: [{ id: 'p1', description: 'Proposal 1', title: null, timestamp: 100 }], totalCount: 1 })
      ));
      const client = createTestClient();
      const result = await client.listProposals({}, 'uniswap');
      expect(result[0]?.id).toBe('p1');
      expect(result[0]?.daoId).toBe('uniswap');
    });

    it('returns empty array on error', async () => {
      server.use(http.get(`${TEST_BASE_URL}/uniswap/proposals`, () => new HttpResponse(null, { status: 500 })));
      const client = createTestClient();
      expect(await client.listProposals({}, 'uniswap')).toEqual([]);
    });
  });

  describe('multi-DAO fan-out', () => {
    it('continues when one DAO fails', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
          { id: 'dao1' }, { id: 'dao2' }, { id: 'dao3' }
        ]))),
        http.get(`${TEST_BASE_URL}/dao1/proposals`, () =>
          HttpResponse.json({ items: [{ id: 'p1', description: 'P1', title: null, timestamp: 200 }], totalCount: 1 })),
        http.get(`${TEST_BASE_URL}/dao2/proposals`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${TEST_BASE_URL}/dao3/proposals`, () =>
          HttpResponse.json({ items: [{ id: 'p3', description: 'P3', title: null, timestamp: 300 }], totalCount: 1 })),
      );
      const client = createTestClient();
      const result = await client.listProposals();
      const ids = result.map((p: any) => p.id);
      expect(ids).toContain('p1');
      expect(ids).toContain('p3');
      expect(ids).not.toContain(undefined);
    });

    it('sorts globally by timestamp DESC', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
          { id: 'dao1' }, { id: 'dao2' }, { id: 'dao3' }
        ]))),
        http.get(`${TEST_BASE_URL}/dao1/proposals`, () => HttpResponse.json({ items: [{ id: 'old', timestamp: 1000, description: '', title: null }], totalCount: 1 })),
        http.get(`${TEST_BASE_URL}/dao2/proposals`, () => HttpResponse.json({ items: [{ id: 'newest', timestamp: 3000, description: '', title: null }], totalCount: 1 })),
        http.get(`${TEST_BASE_URL}/dao3/proposals`, () => HttpResponse.json({ items: [{ id: 'middle', timestamp: 2000, description: '', title: null }], totalCount: 1 })),
      );
      const client = createTestClient();
      const result = await client.listProposals();
      expect(result.map((p: any) => p.id)).toEqual(['newest', 'middle', 'old']);
    });
  });
});

function sampleHistoricalVP(accountId: string, timestamp: string) {
  return {
    accountId,
    timestamp,
    address: `0x${accountId}`,
    votingPower: '1000',
    delta: '500',
    daoId: 'dao1',
    transactionHash: '0xtxhash',
    logIndex: 0,
    delegation: null,
    transfer: null,
  };
}

describe('listVotingPowerHistory', () => {
  describe('per-DAO', () => {
    it('returns empty array for empty response', async () => {
      server.use(http.get(`${TEST_BASE_URL}/ens/voting-powers/historical`, () =>
        HttpResponse.json({ items: [], totalCount: 0 })
      ));
      const client = createTestClient();
      expect(await client.listVotingPowerHistory({}, 'ens')).toEqual([]);
    });

    it('returns empty array on error', async () => {
      server.use(http.get(`${TEST_BASE_URL}/ens/voting-powers/historical`, () => new HttpResponse(null, { status: 500 })));
      const client = createTestClient();
      expect(await client.listVotingPowerHistory({}, 'ens')).toEqual([]);
    });
  });

  describe('multi-DAO fan-out', () => {
    it('skips failed DAOs and processes valid ones', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
          { id: 'dao1', chainId: 1 }, { id: 'dao2', chainId: 1 }, { id: 'dao3', chainId: 1 }
        ]))),
        http.get(`${TEST_BASE_URL}/dao1/voting-powers/historical`, () =>
          HttpResponse.json({ items: [sampleHistoricalVP('acc1', '100')], totalCount: 1 })),
        http.get(`${TEST_BASE_URL}/dao2/voting-powers/historical`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${TEST_BASE_URL}/dao3/voting-powers/historical`, () =>
          HttpResponse.json({ items: [sampleHistoricalVP('acc2', '200')], totalCount: 1 })),
      );
      const client = createTestClient();
      const result = await client.listVotingPowerHistory();
      expect(result).toHaveLength(2);
      // sorted ASC by timestamp
      expect(result[0]?.accountId).toBe('acc1');
      expect(result[1]?.accountId).toBe('acc2');
    });

    it('returns empty array when all DAOs fail', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
          { id: 'dao1' }, { id: 'dao2' }
        ]))),
        http.get(`${TEST_BASE_URL}/dao1/voting-powers/historical`, () => new HttpResponse(null, { status: 500 })),
        http.get(`${TEST_BASE_URL}/dao2/voting-powers/historical`, () => new HttpResponse(null, { status: 500 })),
      );
      const client = createTestClient();
      expect(await client.listVotingPowerHistory()).toEqual([]);
    });
  });
});

describe('listVotes', () => {
  it('returns votes for a DAO', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/votes`, () =>
      HttpResponse.json({
        items: [{ transactionHash: '0xabc', proposalId: 'p1', voterAddress: '0x1', votingPower: '100', timestamp: 1000 }],
        totalCount: 1,
      })
    ));
    const client = createTestClient();
    const result = await client.listVotes('ens');
    expect(result).toHaveLength(1);
    expect(result[0].proposalId).toBe('p1');
  });

  it('returns empty array on error', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/votes`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.listVotes('ens')).toEqual([]);
  });
});

describe('getProposalNonVoters', () => {
  it('returns non-voters list', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/proposals/p1/non-voters`, () =>
      HttpResponse.json({ items: [{ voter: '0xabc' }], totalCount: 1 })
    ));
    const client = createTestClient();
    const result = await client.getProposalNonVoters('p1', 'ens');
    expect(result).toEqual([{ voter: '0xabc' }]);
  });

  it('returns empty array on error', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/proposals/p1/non-voters`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.getProposalNonVoters('p1', 'ens')).toEqual([]);
  });
});

describe('getOffchainProposalNonVoters', () => {
  it('returns offchain non-voters from offchain-enabled DAO', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: true, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals/sp-1/non-voters`, () =>
        HttpResponse.json({ items: [{ voter: '0xdef', votingPower: '500' }], totalCount: 1 })
      ),
    );
    const client = createTestClient();
    const result = await client.getOffchainProposalNonVoters('sp-1');
    expect(result).toEqual([{ voter: '0xdef', votingPower: '500' }]);
  });

  it('skips DAO on 404 and continues to next', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'uniswap', votingDelay: '0', chainId: 1, supportOffchainData: true, alreadySupportCalldataReview: false },
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: true, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/uniswap/offchain/proposals/sp-2/non-voters`, () => new HttpResponse(null, { status: 404 })),
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals/sp-2/non-voters`, () =>
        HttpResponse.json({ items: [{ voter: '0x123' }], totalCount: 1 })
      ),
    );
    const client = createTestClient();
    const result = await client.getOffchainProposalNonVoters('sp-2');
    expect(result).toEqual([{ voter: '0x123' }]);
  });

  it('returns empty array when no offchain-enabled DAOs', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: false, alreadySupportCalldataReview: false },
        ])
      )),
    );
    const client = createTestClient();
    expect(await client.getOffchainProposalNonVoters('sp-3')).toEqual([]);
  });

  it('returns empty array when all DAOs return 404', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: true, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals/missing/non-voters`, () => new HttpResponse(null, { status: 404 })),
    );
    const client = createTestClient();
    expect(await client.getOffchainProposalNonVoters('missing')).toEqual([]);
  });

  it('returns empty array on 500 from all offchain DAOs', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(
        daosResponse([
          { id: 'ens', votingDelay: '0', chainId: 1, supportOffchainData: true, alreadySupportCalldataReview: false },
        ])
      )),
      http.get(`${TEST_BASE_URL}/ens/offchain/proposals/sp-error/non-voters`, () => new HttpResponse(null, { status: 500 })),
    );
    const client = createTestClient();
    expect(await client.getOffchainProposalNonVoters('sp-error')).toEqual([]);
  });
});

describe('listOffchainVotes', () => {
  it('returns offchain votes for a DAO', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/offchain/votes`, () =>
      HttpResponse.json({
        items: [{ voter: '0x1', created: 1000, proposalId: 'sp1', proposalTitle: 'Title' }],
        totalCount: 1,
      })
    ));
    const client = createTestClient();
    const result = await client.listOffchainVotes('ens');
    expect(result).toHaveLength(1);
  });

  it('returns empty array on error', async () => {
    server.use(http.get(`${TEST_BASE_URL}/ens/offchain/votes`, () => new HttpResponse(null, { status: 500 })));
    const client = createTestClient();
    expect(await client.listOffchainVotes('ens')).toEqual([]);
  });
});

describe('listRecentVotesFromAllDaos', () => {
  it('aggregates votes from all DAOs sorted ASC by timestamp', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
        { id: 'dao1' }, { id: 'dao2' }
      ]))),
      http.get(`${TEST_BASE_URL}/dao1/votes`, () =>
        HttpResponse.json({ items: [{ transactionHash: '0x1', proposalId: 'p1', voterAddress: '0xaaa', votingPower: '100', timestamp: 2000 }], totalCount: 1 })),
      http.get(`${TEST_BASE_URL}/dao2/votes`, () =>
        HttpResponse.json({ items: [{ transactionHash: '0x2', proposalId: 'p2', voterAddress: '0xbbb', votingPower: '200', timestamp: 1000 }], totalCount: 1 })),
    );
    const client = createTestClient();
    const result = await client.listRecentVotesFromAllDaos('900');
    expect(result).toHaveLength(2);
    expect(result[0]?.timestamp).toBe(1000); // sorted ASC
    expect(result[1]?.timestamp).toBe(2000);
    expect(result[0]?.daoId).toBe('dao2');
    expect(result[1]?.daoId).toBe('dao1');
  });

  it('skips DAOs that fail and returns results from others', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
        { id: 'dao1' }, { id: 'dao2' }
      ]))),
      http.get(`${TEST_BASE_URL}/dao1/votes`, () => new HttpResponse(null, { status: 500 })),
      http.get(`${TEST_BASE_URL}/dao2/votes`, () =>
        HttpResponse.json({ items: [{ transactionHash: '0x2', proposalId: 'p2', voterAddress: '0xbbb', votingPower: '200', timestamp: 1000 }], totalCount: 1 })),
    );
    const client = createTestClient();
    const result = await client.listRecentVotesFromAllDaos('900');
    expect(result).toHaveLength(1);
    expect(result[0]?.daoId).toBe('dao2');
  });
});

describe('listRecentOffchainVotesFromAllDaos', () => {
  it('only queries DAOs with supportOffchainData: true', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
        { id: 'dao1', supportOffchainData: true },
        { id: 'dao2', supportOffchainData: false },
        { id: 'dao3', supportOffchainData: true },
      ]))),
      http.get(`${TEST_BASE_URL}/dao1/offchain/votes`, () =>
        HttpResponse.json({ items: [{ voter: '0xaaa', created: 2000, proposalId: 'sp1', proposalTitle: 'T1' }], totalCount: 1 })),
      // dao2 is filtered out — no handler needed
      http.get(`${TEST_BASE_URL}/dao3/offchain/votes`, () =>
        HttpResponse.json({ items: [{ voter: '0xbbb', created: 1000, proposalId: 'sp2', proposalTitle: 'T2' }], totalCount: 1 })),
    );
    const client = createTestClient();
    const result = await client.listRecentOffchainVotesFromAllDaos(900);
    expect(result).toHaveLength(2);
    expect(result[0]?.created).toBe(1000); // sorted ASC
    expect(result[1]?.created).toBe(2000);
  });

  it('returns empty array when no DAOs support offchain data', async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/daos`, () => HttpResponse.json(daosResponse([
        { id: 'dao1', supportOffchainData: false }
      ]))),
    );
    const client = createTestClient();
    expect(await client.listRecentOffchainVotesFromAllDaos(900)).toEqual([]);
  });
});
