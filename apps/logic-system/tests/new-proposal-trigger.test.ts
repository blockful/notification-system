import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { DispatcherService } from '../src/interfaces/dispatcher.interface';
import { ProposalOnChain, ProposalStatus, ProposalDB } from '../src/interfaces/proposal.interface';

describe('NewProposalTrigger', () => {
  let mockDispatcherService: jest.Mocked<DispatcherService>;
  let mockProposalDB: jest.Mocked<ProposalDB>;
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
    mockDispatcherService = {
      sendMessage: jest.fn()
    };
    
    mockProposalDB = {
      getById: jest.fn(),
      listAll: jest.fn()
    };
    
    trigger = new NewProposalTrigger(
      mockDispatcherService,
      mockProposalDB,
      60000
    );
  });

  describe('process', () => {
    it('should process empty array', async () => {
      await trigger.process([]);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockDispatcherService.sendMessage.mock.calls[0][0].payload).toEqual([]);
      expect(mockDispatcherService.sendMessage.mock.calls[0][0].triggerId).toBe('newProposalTrigger');
    });

    it('should send proposals to dispatcher service with correct data formatting', async () => {
      const proposals: ProposalOnChain[] = [
        { ...mockProposal, status: 'active' },
        { ...mockProposal, id: '2', status: 'active' }
      ];
      
      await trigger.process(proposals);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      
      const calledWith = mockDispatcherService.sendMessage.mock.calls[0][0];
      expect(calledWith.triggerId).toBe('newProposalTrigger');
      
      const sentData = calledWith.payload;
      expect(sentData).toHaveLength(2);
      
      const ids = sentData.map((p: any) => p.id);
      expect(ids).toContain('1');
      expect(ids).toContain('2');
      
      expect(typeof sentData[0].forVotes).toBe('bigint');
      expect(sentData[0].forVotes).toBe(100n);
      expect(sentData[0].againstVotes).toBe(50n);
      expect(sentData[0].abstainVotes).toBe(10n);
    });

    it('should propagate errors from dispatcher service', async () => {
      const errorMessage = 'Connection failed';
      mockDispatcherService.sendMessage.mockRejectedValue(new Error(errorMessage));
      
      await expect(trigger.process([mockProposal])).rejects.toThrow(errorMessage);
    });
  });
  
  describe('start and stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockProposalDB.listAll.mockResolvedValue([mockProposal]);
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should throw error if status option is not provided', async () => {
      const fetchDataMethod = trigger['fetchData'].bind(trigger);
      await expect(fetchDataMethod({})).rejects.toThrow('Status is required in filter options');
    });

    it('should start the interval and fetch proposals with correct status', () => {
      trigger.start({ status: 'active' });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDB.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'active' });
    });
    
    it('should stop and restart the interval if start is called twice', () => {
      const stopSpy = jest.spyOn(trigger, 'stop');
      trigger.start({ status: 'active' });
      trigger.start({ status: 'pending' });
      expect(stopSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'pending' });
    });
    
    it('should stop the interval when stop is called', () => {
      trigger.start({ status: 'active' });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDB.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'active' });
      
      mockProposalDB.listAll.mockClear();
      trigger.stop();
      
      jest.advanceTimersByTime(60000);
      expect(mockProposalDB.listAll).not.toHaveBeenCalled();
    });
  });
}); 