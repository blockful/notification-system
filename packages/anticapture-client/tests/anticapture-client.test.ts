import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import { createMockClient, createProposalResponse, createVotingPowerResponse } from './test-helpers';
import { TEST_FIXTURES } from './constants';

describe('AnticaptureClient', () => {
  let client: AnticaptureClient;
  let mockQuery: jest.Mock<() => Promise<any>>;

  beforeEach(() => {
    ({ client, mockQuery } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDAOs', () => {
    it('returns empty array for empty response', async () => {
      mockQuery.mockResolvedValue({ daos: { items: [] } });
      
      const result = await client.getDAOs();
      
      expect(result).toEqual([]);
    });

    it('adds blockTime and defaults to valid DAOs', async () => {
      mockQuery.mockResolvedValue({
        daos: {
          items: Object.values(TEST_FIXTURES.daos)
        }
      });

      const result = await client.getDAOs();

      expect(result).toEqual([
        { id: 'UNISWAP', blockTime: 12, votingDelay: '1000' },
        { id: 'ENS', blockTime: 12, votingDelay: '500' },
        { id: 'COMPOUND', blockTime: 12, votingDelay: '0' }
      ]);
    });

    it('handles API errors gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('Internal Server Error'));
      
      const result = await client.getDAOs();
      
      expect(result).toEqual([]);
    });
  });

  describe('listProposals', () => {
    it('returns empty array for empty response', async () => {
      mockQuery.mockResolvedValue({ proposals: [] });

      const result = await client.listProposals({}, 'UNISWAP');

      expect(result).toEqual([]);
    });

    it('adds daoId to each proposal', async () => {
      mockQuery.mockResolvedValue({
        proposals: TEST_FIXTURES.proposals.basic
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
          chainId: 1
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);
      });

      it('continues processing when one DAO fails', async () => {
        mockQuery
          .mockResolvedValueOnce(createProposalResponse('p1', 'Proposal 1'))
          .mockRejectedValueOnce(new Error('DAO2 failed'))
          .mockResolvedValueOnce(createProposalResponse('p3', 'Proposal 3'));

        const result = await client.listProposals();

        expect(result).toEqual([
          { id: 'p1', description: 'Proposal 1', title: null, daoId: 'DAO1' },
          { id: 'p3', description: 'Proposal 3', title: null, daoId: 'DAO3' }
        ]);
      });
    });
  });

  describe('getProposalById', () => {
    it('returns null when API fails', async () => {
      mockQuery.mockRejectedValue(new Error('API Error'));
      
      const result = await client.getProposalById('proposal-123');
      
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
          chainId: 1
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);
      });

      it('filters out failed DAOs and processes valid ones', async () => {
        mockQuery
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
          chainId: 1
        }));
        jest.spyOn(client, 'getDAOs').mockResolvedValue(mockDAOs);

        mockQuery
          .mockRejectedValueOnce(new Error('DAO1 error'))
          .mockRejectedValueOnce(new Error('DAO2 error'));

        const result = await client.listVotingPowerHistory();

        expect(result).toEqual([]);
      });
    });
  });
});