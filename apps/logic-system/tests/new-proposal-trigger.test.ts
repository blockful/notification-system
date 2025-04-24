import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { QueueRepository, PublishResult } from '../src/interfaces/repositories/queue-repository.interface';
import { ProposalOnChain, ProposalStatus } from '../src/interfaces/repositories/proposal-repository.interface';

describe('NewProposalTrigger', () => {
  let mockQueueRepository: jest.Mocked<QueueRepository>;
  let trigger: NewProposalTrigger;
  
  const mockProposal: ProposalOnChain = {
    id: '1',
    dao_id: 'dao1',
    proposer_account_id: 'user1',
    targets: ['0x123'],
    values: ['0'],
    signatures: ['vote()'],
    calldatas: ['0x0'],
    start_block: 100,
    end_block: 200,
    description: 'Test proposal',
    timestamp: '2023-01-01T00:00:00Z',
    status: 'active' as ProposalStatus,
    for_votes: BigInt(100),
    against_votes: BigInt(50),
    abstain_votes: BigInt(10)
  };

  beforeEach(() => {
    mockQueueRepository = {
      publishMessage: jest.fn()
    };
    
    trigger = new NewProposalTrigger(mockQueueRepository, 60000);
  });

  describe('filter', () => {
    it('should filter proposals by status', async () => {
      const proposals = [
        { ...mockProposal, status: 'active' },
        { ...mockProposal, id: '2', status: 'pending' },
        { ...mockProposal, id: '3', status: 'active' }
      ] as ProposalOnChain[];

      const result = await trigger.filter(proposals, { status: 'active' });
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should throw error if status is not provided', async () => {
      const proposals = [mockProposal];
      
      await expect(trigger.filter(proposals, {})).rejects.toThrow('Status is required');
    });
  });

  describe('process', () => {
    it('should return NO_PROPOSALS message when no proposals are provided', async () => {
      const result = await trigger.process([]);
      
      expect(result).toBe('There are no new proposals.');
      expect(mockQueueRepository.publishMessage).not.toHaveBeenCalled();
    });

    it('should publish message to queue when proposals exist', async () => {
      mockQueueRepository.publishMessage.mockResolvedValue({ success: true } as PublishResult);
      
      const result = await trigger.process([mockProposal]);
      
      expect(result).toBe('New proposal sent to the queue.');
      expect(mockQueueRepository.publishMessage).toHaveBeenCalledTimes(1);
      expect(mockQueueRepository.publishMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_id: 'new_proposal_trigger',
          context: expect.any(String)
        })
      );
    });

    it('should throw error when publishing fails', async () => {
      mockQueueRepository.publishMessage.mockResolvedValue({ 
        success: false, 
        error: 'Failed to publish' 
      } as PublishResult);
      
      await expect(trigger.process([mockProposal])).rejects.toThrow('Failed to publish');
    });
  });
}); 