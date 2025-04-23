import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { new_proposal_trigger_logic } from '../src/newProposalTrigger';
import { ProposalRepository, ProposalOnChain } from '../src/interfaces/proposalRepository';
import { QueueRepository, Message, PublishResult } from '../src/interfaces/queueRepository';

describe('New Proposal Trigger Logic', () => {
  // Test constants
  const TRIGGER_ID = 'new_proposal_trigger';
  const MESSAGES = {
    SUCCESS: 'New proposal sent to the queue.',
    NO_PROPOSALS: 'There are no new proposals.'
  };

  // Mock data
  const mockActiveProposal: ProposalOnChain = {
    id: "1",
    dao_id: "dao1",
    proposer_account_id: "proposer1",
    targets: ["0x123"],
    values: ["0"],
    signatures: ["signature1"],
    calldatas: ["0x0"],
    start_block: 100,
    end_block: 200,
    description: "First proposal",
    timestamp: "2024-03-20T10:00:00Z",
    status: "active",
    for_votes: BigInt("100"),
    against_votes: BigInt("50"),
    abstain_votes: BigInt("10")
  };

  // Serialized version for test assertions
  const serializedActiveProposal = {
    ...mockActiveProposal,
    for_votes: "100",
    against_votes: "50",
    abstain_votes: "10"
  };

  const successResult: PublishResult = {
    success: true
  };

  const failureResult: PublishResult = {
    success: false,
    error: 'Queue service unavailable'
  };

  // Repository mocks
  let mockProposalRepository: jest.Mocked<ProposalRepository>;
  let mockQueueRepository: jest.Mocked<QueueRepository>;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockProposalRepository = {
      getById: jest.fn(),
      listAll: jest.fn()
    } as jest.Mocked<ProposalRepository>;

    const publishMessageMock = jest.fn().mockImplementation(
      (message: Message): Promise<PublishResult> => Promise.resolve(successResult)
    );

    mockQueueRepository = {
      publishMessage: publishMessageMock
    } as jest.Mocked<QueueRepository>;

    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should process active proposals correctly', async () => {
      mockProposalRepository.listAll.mockResolvedValue([mockActiveProposal]);
      
      const result = await new_proposal_trigger_logic(mockProposalRepository, mockQueueRepository);
      
      expect(result).toBe(MESSAGES.SUCCESS);
      expect(mockProposalRepository.listAll).toHaveBeenCalledWith({ status: 'active' });
      expect(mockQueueRepository.publishMessage).toHaveBeenCalledTimes(1);
      expect(mockQueueRepository.publishMessage).toHaveBeenCalledWith({
        trigger_id: TRIGGER_ID,
        context: JSON.stringify([serializedActiveProposal])
      });
    });

    it('should return no proposals message when no active proposals exist', async () => {
      mockProposalRepository.listAll.mockResolvedValue([]);
      
      const result = await new_proposal_trigger_logic(mockProposalRepository, mockQueueRepository);
      
      expect(result).toBe(MESSAGES.NO_PROPOSALS);
      expect(mockQueueRepository.publishMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw error when proposal repository fails', async () => {
      const error = new Error('Database connection failed');
      mockProposalRepository.listAll.mockRejectedValue(error);
      
      await expect(new_proposal_trigger_logic(mockProposalRepository, mockQueueRepository))
        .rejects
        .toThrow(error);
      
      expect(mockQueueRepository.publishMessage).not.toHaveBeenCalled();
    });

    it('should throw error when queue repository fails', async () => {
      mockProposalRepository.listAll.mockResolvedValue([mockActiveProposal]);
      mockQueueRepository.publishMessage.mockResolvedValue(failureResult);
      
      await expect(new_proposal_trigger_logic(mockProposalRepository, mockQueueRepository))
        .rejects
        .toThrow(failureResult.error);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined values in proposal list', async () => {
      mockProposalRepository.listAll.mockResolvedValue([null, mockActiveProposal, undefined] as any);
      
      const result = await new_proposal_trigger_logic(mockProposalRepository, mockQueueRepository);
      
      expect(result).toBe(MESSAGES.SUCCESS);
      expect(mockQueueRepository.publishMessage).toHaveBeenCalledWith({
        trigger_id: TRIGGER_ID,
        context: JSON.stringify([serializedActiveProposal])
      });
    });
  });
});

