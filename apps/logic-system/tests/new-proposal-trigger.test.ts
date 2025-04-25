import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ApiRepository, ApiCallResult } from '../src/interfaces/repositories/api-repository.interface';
import { ProposalOnChain, ProposalStatus } from '../src/interfaces/repositories/proposal-repository.interface';

describe('NewProposalTrigger', () => {
  let mockApiRepository: jest.Mocked<ApiRepository>;
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
    mockApiRepository = {
      sendMessage: jest.fn()
    };
    
    trigger = new NewProposalTrigger(mockApiRepository, 60000);
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
      expect(mockApiRepository.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message to API when proposals exist', async () => {
      mockApiRepository.sendMessage.mockResolvedValue({ success: true } as ApiCallResult);
      
      const result = await trigger.process([mockProposal]);
      
      expect(result).toBe('New proposal sent to the API.');
      expect(mockApiRepository.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockApiRepository.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_id: 'new_proposal_trigger',
          context: expect.any(String)
        })
      );
    });

    it('should throw error when API call fails', async () => {
      mockApiRepository.sendMessage.mockResolvedValue({ 
        success: false, 
        error: 'Failed to send to API' 
      } as ApiCallResult);
      
      await expect(trigger.process([mockProposal])).rejects.toThrow('Failed to send to API');
    });
  });
}); 