import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import { FeedEventType, FeedRelevance } from '../src/schemas';
import { createMockClient, createProposalResponse, createVotingPowerResponse } from './test-helpers';
import { TEST_FIXTURES } from './constants';

describe('AnticaptureClient', () => {
  let client: AnticaptureClient;
  let mockRequest: jest.Mock<() => Promise<any>>;

  beforeEach(() => {
    ({ client, mockRequest } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDAOs', () => {
    it('returns empty array for empty response', async () => {
      mockRequest.mockResolvedValue({ items: [], totalCount: 0 });
      
      const result = await client.getDAOs();
      
      expect(result).toEqual([]);
    });

    it('adds blockTime and defaults to valid DAOs', async () => {
      mockRequest.mockResolvedValue({
        items: Object.values(TEST_FIXTURES.daos),
        totalCount: 3
      });

      const result = await client.getDAOs();

      expect(result).toEqual([
        { id: 'UNISWAP', blockTime: 12, votingDelay: '1000', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
        { id: 'ENS', blockTime: 12, votingDelay: '500', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false },
        { id: 'COMPOUND', blockTime: 12, votingDelay: '0', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false }
      ]);
    });

    it('handles API errors gracefully', async () => {
      mockRequest.mockRejectedValue(new Error('Internal Server Error'));
      
      const result = await client.getDAOs();
      
      expect(result).toEqual([]);
    });
  });

  describe('listProposals', () => {
    it('returns empty array for empty response', async () => {
      mockRequest.mockResolvedValue({ items: [], totalCount: 0 });

      const result = await client.listProposals({}, 'UNISWAP');

      expect(result).toEqual([]);
    });

    it('adds daoId to each proposal', async () => {
      mockRequest.mockResolvedValue({
        items: TEST_FIXTURES.proposals.basic,
        totalCount: TEST_FIXTURES.proposals.basic.length
      });

      const result = await client.listProposals({}, 'UNISWAP');

      expect(result).toEqual(
        TEST_FIXTURES.proposals.basic.map(p => ({ ...p, daoId: 'UNISWAP' }))
      );
    });

    describe('multi-DAO processing', () => {
      beforeEach(() => {
        const mockDAOs = ['DAO1', 'DAO2', 'DAO3'].map(id => ({
          id,
          blockTime: 12,
          votingDelay: '0',
          chainId: 1,
          alreadySupportCalldataReview: true,
          supportOffchainData: true
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);
      });

      it('continues processing when one DAO fails', async () => {
        mockRequest
          .mockResolvedValueOnce({ items: [{ ...createProposalResponse('p1', 'Proposal 1').items[0], daoId: 'dao1' }], totalCount: 1 })
          .mockRejectedValueOnce(new Error('DAO2 failed'))
          .mockResolvedValueOnce({ items: [{ ...createProposalResponse('p3', 'Proposal 3').items[0], daoId: 'dao3' }], totalCount: 1 });

        const result = await client.listProposals();

        expect(result).toEqual([
          expect.objectContaining({ id: 'p1', description: 'Proposal 1', daoId: 'DAO1' }),
          expect.objectContaining({ id: 'p3', description: 'Proposal 3', daoId: 'DAO3' })
        ]);
      });

      it('sorts proposals globally by timestamp DESC regardless of DAO order', async () => {
        // Simulate proposals from different DAOs with unsorted timestamps
        mockRequest
          .mockResolvedValueOnce({ items: [{ ...createProposalResponse('dao1-old', 'Old from DAO1').items[0], timestamp: 1000 }], totalCount: 1 })
          .mockResolvedValueOnce({ items: [{ ...createProposalResponse('dao2-newest', 'Newest from DAO2').items[0], timestamp: 3000 }], totalCount: 1 })
          .mockResolvedValueOnce({ items: [{ ...createProposalResponse('dao3-middle', 'Middle from DAO3').items[0], timestamp: 2000 }], totalCount: 1 });

        const result = await client.listProposals();

        // Should be sorted by timestamp DESC (newest first)
        expect(result).toHaveLength(3);
        expect(result[0]!.id).toBe('dao2-newest');
        expect(result[0]!.timestamp).toBe(3000);
        expect(result[1]!.id).toBe('dao3-middle');
        expect(result[1]!.timestamp).toBe(2000);
        expect(result[2]!.id).toBe('dao1-old');
        expect(result[2]!.timestamp).toBe(1000);
      });
    });
  });

  describe('getProposalById', () => {
    it('returns null when API fails', async () => {
      jest.spyOn(client, 'getDAOs').mockResolvedValue([{ id: 'ENS', blockTime: 12, votingDelay: '0', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: false }]);
      mockRequest.mockRejectedValue(new Error('API Error'));
      
      const result = await client.getProposalById('proposal-123');
      
      expect(result).toBeNull();
    });
  });

  describe('getEventThreshold', () => {
    it('returns threshold string for a valid response', async () => {
      mockRequest.mockResolvedValue({ threshold: '40000000000000000000000' });

      const result = await client.getEventThreshold('ENS', FeedEventType.Delegation, FeedRelevance.High);

      expect(result).toBe('40000000000000000000000');
    });

    it('returns null when query throws', async () => {
      mockRequest.mockRejectedValue(new Error('Something went wrong'));

      const result = await client.getEventThreshold('ENS', FeedEventType.Vote, FeedRelevance.High);

      expect(result).toBeNull();
    });

    it('returns null when response has unexpected shape', async () => {
      mockRequest.mockResolvedValue({ unexpected: 'data' });

      const result = await client.getEventThreshold('ENS', FeedEventType.Transfer, FeedRelevance.High);

      expect(result).toBeNull();
    });
  });

  describe('listVotingPowerHistory', () => {
    describe('error handling', () => {
      beforeEach(() => {
        const mockDAOs = ['VALID_DAO', 'ERROR_DAO', 'ANOTHER_VALID'].map(id => ({
          id,
          blockTime: 12,
          votingDelay: '0',
          chainId: 1,
          alreadySupportCalldataReview: true,
          supportOffchainData: true
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);
      });

      it('filters out failed DAOs and processes valid ones', async () => {
        mockRequest
          .mockResolvedValueOnce(createVotingPowerResponse('100', 'acc1'))
          .mockRejectedValueOnce(new Error('ERROR_DAO failed'))
          .mockResolvedValueOnce(createVotingPowerResponse('200', 'acc2'));

        const result = await client.listVotingPowerHistory();

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ 
          timestamp: '100', 
          accountId: 'acc1',
          daoId: 'VALID_DAO' 
        });
        expect(result[1]).toMatchObject({ 
          timestamp: '200', 
          accountId: 'acc2',
          daoId: 'ANOTHER_VALID' 
        });
      });

      it('returns empty array when all DAOs fail', async () => {
        const mockDAOs = ['DAO1', 'DAO2'].map(id => ({
          id,
          blockTime: 12,
          votingDelay: '0',
          chainId: 1,
          alreadySupportCalldataReview: true,
          supportOffchainData: true
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);

        mockRequest
          .mockRejectedValueOnce(new Error('DAO1 error'))
          .mockRejectedValueOnce(new Error('DAO2 error'));

        const result = await client.listVotingPowerHistory();

        expect(result).toEqual([]);
      });
    });
  });
});
