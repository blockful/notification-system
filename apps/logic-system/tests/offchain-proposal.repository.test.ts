/**
 * @fileoverview Unit tests for OffchainProposalRepository.listActiveForReminder()
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OffchainProposalRepository } from '../src/repositories/offchain-proposal.repository';
import { VotingReminderProposal } from '../src/interfaces/voting-reminder.interface';

const createMockAnticaptureClient = () => ({
  listOffchainProposals: jest.fn<() => Promise<any[]>>(),
});

describe('OffchainProposalRepository', () => {
  let repository: OffchainProposalRepository;
  let mockClient: ReturnType<typeof createMockAnticaptureClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockAnticaptureClient();
    repository = new OffchainProposalRepository(mockClient as any);
  });

  describe('listActiveForReminder', () => {
    it('should call listAll with status: active', async () => {
      mockClient.listOffchainProposals.mockResolvedValue([]);

      await repository.listActiveForReminder();

      expect(mockClient.listOffchainProposals).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should map proposals correctly — uses start when available', async () => {
      const mockProposals = [
        {
          id: 'snap-1',
          title: 'Snapshot Proposal 1',
          discussion: 'https://forum.example.com/1',
          link: 'https://snapshot.org/#/dao/proposal/1',
          state: 'active',
          created: 1000000,
          end: 2000000,
          start: 1000100, // has start field — should be used as startTime
          daoId: 'test-dao',
        },
      ];

      mockClient.listOffchainProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual<VotingReminderProposal[]>([
        {
          id: 'snap-1',
          daoId: 'test-dao',
          title: 'Snapshot Proposal 1',
          startTime: 1000100, // uses start
          endTime: 2000000,
          link: 'https://snapshot.org/#/dao/proposal/1',
          discussion: 'https://forum.example.com/1',
        },
      ]);
    });

    it('should fall back to created when start field is absent', async () => {
      const mockProposals = [
        {
          id: 'snap-2',
          title: 'Snapshot Proposal 2',
          discussion: '',
          link: 'https://snapshot.org/#/dao/proposal/2',
          state: 'active',
          created: 1100000,
          end: 2100000,
          // no start field — should fall back to created
          daoId: 'test-dao',
        },
      ];

      mockClient.listOffchainProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual<VotingReminderProposal[]>([
        {
          id: 'snap-2',
          daoId: 'test-dao',
          title: 'Snapshot Proposal 2',
          startTime: 1100000, // falls back to created
          endTime: 2100000,
          link: 'https://snapshot.org/#/dao/proposal/2',
          discussion: '',
        },
      ]);
    });

    it('should map multiple proposals correctly — mix of start present and absent', async () => {
      const mockProposals = [
        {
          id: 'snap-1',
          title: 'Snapshot Proposal 1',
          discussion: 'https://forum.example.com/1',
          link: 'https://snapshot.org/#/dao/proposal/1',
          state: 'active',
          created: 1000000,
          end: 2000000,
          start: 1000100,
          daoId: 'test-dao',
        },
        {
          id: 'snap-2',
          title: 'Snapshot Proposal 2',
          discussion: '',
          link: 'https://snapshot.org/#/dao/proposal/2',
          state: 'active',
          created: 1100000,
          end: 2100000,
          daoId: 'test-dao',
        },
      ];

      mockClient.listOffchainProposals.mockResolvedValue(mockProposals);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual<VotingReminderProposal[]>([
        {
          id: 'snap-1',
          daoId: 'test-dao',
          title: 'Snapshot Proposal 1',
          startTime: 1000100,
          endTime: 2000000,
          link: 'https://snapshot.org/#/dao/proposal/1',
          discussion: 'https://forum.example.com/1',
        },
        {
          id: 'snap-2',
          daoId: 'test-dao',
          title: 'Snapshot Proposal 2',
          startTime: 1100000,
          endTime: 2100000,
          link: 'https://snapshot.org/#/dao/proposal/2',
          discussion: '',
        },
      ]);
    });

    it('should return empty array when there are no active proposals', async () => {
      mockClient.listOffchainProposals.mockResolvedValue([]);

      const result = await repository.listActiveForReminder();

      expect(result).toEqual([]);
    });
  });
});
