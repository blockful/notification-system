/**
 * @fileoverview Unit tests for ProposalRepository.listActiveForReminder()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ProposalRepository } from '../src/repositories/proposal.repository';
import { VotingReminderProposal } from '../src/interfaces/voting-reminder.interface';

const createMockAnticaptureClient = () => ({
  listProposals: jest.fn<() => Promise<any[]>>(),
  getProposalById: jest.fn<() => Promise<any>>(),
});

describe('ProposalRepository', () => {
  let repository: ProposalRepository;
  let mockClient: ReturnType<typeof createMockAnticaptureClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockAnticaptureClient();
    repository = new ProposalRepository(mockClient as any);
  });

  describe('listActiveForReminder', () => {
    it('should call listAll with status ACTIVE and includeOptimisticProposals false', async () => {
      mockClient.listProposals.mockResolvedValue([]);

      await repository.listActiveForReminder();

      expect(mockClient.listProposals).toHaveBeenCalledWith(
        { status: 'ACTIVE', includeOptimisticProposals: false },
        undefined
      );
    });

    it('should map proposals correctly — timestamp to startTime, endTimestamp to endTime', async () => {
      const mockProposals = [
        {
          id: 'prop-1',
          daoId: 'test-dao',
          title: 'On-chain Proposal',
          description: 'A governance proposal',
          timestamp: 1000000,
          endTimestamp: 2000000,
          status: 'ACTIVE',
          __typename: 'OnchainProposal',
          proposerAccountId: 'user1',
          targets: [],
          values: [],
          signatures: [],
          calldatas: [],
          startBlock: 100,
          endBlock: 200,
          forVotes: '0',
          againstVotes: '0',
          abstainVotes: '0',
          txHash: '0xabc',
        },
      ];

      mockClient.listProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual<VotingReminderProposal[]>([
        {
          id: 'prop-1',
          daoId: 'test-dao',
          title: 'On-chain Proposal',
          description: 'A governance proposal',
          startTime: 1000000,
          endTime: 2000000,
        },
      ]);
    });

    it('should carry through title and description', async () => {
      const mockProposals = [
        {
          id: 'prop-2',
          daoId: 'dao-abc',
          title: 'Proposal with Title',
          description: 'Detailed description here',
          timestamp: 500000,
          endTimestamp: 600000,
          status: 'ACTIVE',
          __typename: 'OnchainProposal',
          proposerAccountId: 'user2',
          targets: [],
          values: [],
          signatures: [],
          calldatas: [],
          startBlock: 50,
          endBlock: 100,
          forVotes: '1000',
          againstVotes: '500',
          abstainVotes: '0',
          txHash: '0xdef',
        },
      ];

      mockClient.listProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result[0].title).toBe('Proposal with Title');
      expect(result[0].description).toBe('Detailed description here');
    });

    it('should filter out proposals with null timestamp', async () => {
      const mockProposals = [
        {
          id: 'prop-no-ts',
          daoId: 'test-dao',
          title: 'Proposal without timestamp',
          description: 'Missing timestamps',
          timestamp: null,
          endTimestamp: 2000000,
          status: 'ACTIVE',
          __typename: 'OnchainProposal',
          proposerAccountId: 'user1',
          targets: [],
          values: [],
          signatures: [],
          calldatas: [],
          startBlock: 100,
          endBlock: 200,
          forVotes: '0',
          againstVotes: '0',
          abstainVotes: '0',
          txHash: '0xabc',
        },
      ];

      mockClient.listProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual([]);
    });

    it('should filter out proposals with null endTimestamp', async () => {
      const mockProposals = [
        {
          id: 'prop-no-end',
          daoId: 'test-dao',
          title: 'Proposal without end timestamp',
          description: 'Missing end timestamp',
          timestamp: 1000000,
          endTimestamp: null,
          status: 'ACTIVE',
          __typename: 'OnchainProposal',
          proposerAccountId: 'user1',
          targets: [],
          values: [],
          signatures: [],
          calldatas: [],
          startBlock: 100,
          endBlock: 200,
          forVotes: '0',
          againstVotes: '0',
          abstainVotes: '0',
          txHash: '0xabc',
        },
      ];

      mockClient.listProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual([]);
    });

    it('should return empty array when there are no active proposals', async () => {
      mockClient.listProposals.mockResolvedValue([]);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual([]);
    });
  });
});
