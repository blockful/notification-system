import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ApiRepository, ApiCallResult } from '../src/interfaces/repositories/api-repository.interface';
import { ProposalOnChain, ProposalStatus } from '../src/interfaces/repositories/proposal-repository.interface';

describe('NewProposalTrigger', () => {
  let mockApiRepository: jest.Mocked<ApiRepository>;
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
    mockApiRepository = {
      sendMessage: jest.fn()
    };
    
    trigger = new NewProposalTrigger(mockApiRepository, 60000);
  });

  describe('process', () => {
    it('should throw error if status option is not provided', async () => {
      const proposals = [mockProposal];
      
      await expect(trigger.process(proposals, {})).rejects.toThrow('Status is required');
    });

    it('should return NO_PROPOSALS message when filtered result is empty', async () => {
      // Nenhuma proposta com status 'pending'
      const result = await trigger.process([mockProposal], { status: 'pending' });
      
      expect(result).toBe('There are no new proposals.');
      expect(mockApiRepository.sendMessage).not.toHaveBeenCalled();
    });

    it('should filter proposals by status and send matching ones to API', async () => {
      mockApiRepository.sendMessage.mockResolvedValue({ success: true } as ApiCallResult);
      
      const proposals = [
        { ...mockProposal, status: 'active' },
        { ...mockProposal, id: '2', status: 'pending' },
        { ...mockProposal, id: '3', status: 'active' }
      ] as ProposalOnChain[];
      
      const result = await trigger.process(proposals, { status: 'active' });
      
      expect(result).toBe('New proposal sent to the API.');
      expect(mockApiRepository.sendMessage).toHaveBeenCalledTimes(1);
      
      // Verificar que apenas as propostas com status 'active' foram enviadas
      const calledWith = mockApiRepository.sendMessage.mock.calls[0][0];
      const sentData = JSON.parse(calledWith.context);
      expect(sentData).toHaveLength(2);
      expect(sentData.map(p => p.id).sort()).toEqual(['1', '3']);
    });

    it('should throw error when API call fails', async () => {
      mockApiRepository.sendMessage.mockResolvedValue({ 
        success: false, 
        error: 'Failed to send to API' 
      } as ApiCallResult);
      
      await expect(trigger.process([mockProposal], { status: 'active' })).rejects.toThrow('Failed to send to API');
    });
  });
}); 