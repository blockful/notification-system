import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ApiService, ApiCallResult } from '../src/interfaces/repositories/api-service.interface';
import { ProposalOnChain, ProposalStatus } from '../src/interfaces/repositories/proposal.interface';

describe('NewProposalTrigger', () => {
  let mockApiService: jest.Mocked<ApiService>;
  let trigger: NewProposalTrigger;
  
  const mockProposal: ProposalOnChain = {
    id: '1',
    daoId: 'dao1',
    proposerAccountId: 'user1',
    targets: ['0x123'],
    values: ['0'],
    signatures: ['vote()'],
    calldatas: ['0x0'],
    startBlock: 100,
    endBlock: 200,
    description: 'Test proposal',
    timestamp: '2023-01-01T00:00:00Z',
    status: 'active' as ProposalStatus,
    forVotes: BigInt(100),
    againstVotes: BigInt(50),
    abstainVotes: BigInt(10)
  };

  beforeEach(() => {
    mockApiService = {
      sendMessage: jest.fn()
    };
    
    trigger = new NewProposalTrigger(mockApiService, 60000);
  });

  describe('process', () => {
    it('should throw error if status option is not provided', async () => {
      const proposals = [mockProposal];
      
      await expect(trigger.process(proposals, {})).rejects.toThrow('Status is required');
    });

    it('should return NO_PROPOSALS message when filtered result is empty', async () => {
      const result = await trigger.process([mockProposal], { status: 'pending' });
      
      expect(result).toBe('There are no new proposals.');
      expect(mockApiService.sendMessage).not.toHaveBeenCalled();
    });

    it('should filter proposals by status and send matching ones to API', async () => {
      mockApiService.sendMessage.mockResolvedValue({ success: true } as ApiCallResult);
      
      const proposals = [
        { ...mockProposal, status: 'active' },
        { ...mockProposal, id: '2', status: 'pending' },
        { ...mockProposal, id: '3', status: 'active' }
      ] as ProposalOnChain[];
      
      const result = await trigger.process(proposals, { status: 'active' });
      
      expect(result).toBe('New proposal sent to the API.');
      expect(mockApiService.sendMessage).toHaveBeenCalledTimes(1);
      
      const calledWith = mockApiService.sendMessage.mock.calls[0][0];
      const sentData = JSON.parse(calledWith.context);
      expect(sentData).toHaveLength(2);
      expect(sentData.map((p: ProposalOnChain) => p.id).sort()).toEqual(['1', '3']);
    });

    it('should throw error when API call fails', async () => {
      mockApiService.sendMessage.mockResolvedValue({ 
        success: false, 
        error: 'Failed to send to API' 
      } as ApiCallResult);
      
      await expect(trigger.process([mockProposal], { status: 'active' })).rejects.toThrow('Failed to send to API');
    });
  });
}); 