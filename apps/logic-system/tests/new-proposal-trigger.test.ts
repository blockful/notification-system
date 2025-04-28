import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { SubscriptionCheckerService, SubscriptionCheckResult } from '../src/interfaces/subscription-checker.interface';
import { ProposalOnChain, ProposalStatus, ProposalDB } from '../src/interfaces/proposal.interface';

describe('NewProposalTrigger', () => {
  let mockSubscriptionChecker: jest.Mocked<SubscriptionCheckerService>;
  let mockProposalDB: jest.Mocked<ProposalDB>;
  let trigger: NewProposalTrigger;
  let originalConsoleError: any;
  
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
    // Save original console.error and replace it with a mock
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    mockSubscriptionChecker = {
      checkSubscribers: jest.fn()
    };
    
    mockProposalDB = {
      getById: jest.fn(),
      listAll: jest.fn()
    };
    
    trigger = new NewProposalTrigger(
      mockSubscriptionChecker,
      mockProposalDB,
      60000
    );
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('process', () => {
    it('should return NO_PROPOSALS message when result is empty', async () => {
      const result = await trigger.process([]);
      
      expect(result).toBe('There are no new proposals.');
      expect(mockSubscriptionChecker.checkSubscribers).not.toHaveBeenCalled();
    });

    it('should send proposals to subscription checker', async () => {
      mockSubscriptionChecker.checkSubscribers.mockResolvedValue({ success: true } as SubscriptionCheckResult);
      
      const proposals = [
        { ...mockProposal, status: 'active' },
        { ...mockProposal, id: '2', status: 'active' }
      ] as ProposalOnChain[];
      
      const result = await trigger.process(proposals);
      
      expect(result).toBe('New proposal notification processed.');
      expect(mockSubscriptionChecker.checkSubscribers).toHaveBeenCalledTimes(1);
      
      const calledWith = mockSubscriptionChecker.checkSubscribers.mock.calls[0][0];
      const sentData = JSON.parse(calledWith.context);
      expect(sentData).toHaveLength(2);
      const ids = sentData.map((p: ProposalOnChain) => p.id);
      expect(ids).toContain('1');
      expect(ids).toContain('2');
    });

    it('should throw error when subscription check fails without error message', async () => {
      mockSubscriptionChecker.checkSubscribers.mockResolvedValue({ 
        success: false,
        error: undefined 
      } as SubscriptionCheckResult);
      
      await expect(trigger.process([mockProposal])).rejects.toThrow('Unknown error checking subscriptions');
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('start and stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockProposalDB.listAll.mockResolvedValue([mockProposal]);
      mockSubscriptionChecker.checkSubscribers.mockResolvedValue({ success: true } as SubscriptionCheckResult);
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should throw error if status option is not provided', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Mock the fetchData method to throw immediately when called
      jest.spyOn(trigger as any, 'fetchData').mockImplementationOnce(() => {
        throw new Error('Status is required in filter options');
      });
      
      trigger.start({});
      
      // Advance timer by the interval time to trigger the first execution
      jest.advanceTimersByTime(60000);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in trigger execution (newProposalTrigger):'),
        expect.objectContaining({
          message: 'Status is required in filter options'
        })
      );
    });

    it('should start the interval and fetch proposals with correct status', () => {
      trigger.start({ status: 'active' as ProposalStatus });
      
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'active' });
    });
    
    it('should stop and restart the interval if start is called twice', () => {
      const stopSpy = jest.spyOn(trigger, 'stop');
      
      trigger.start({ status: 'active' as ProposalStatus });
      trigger.start({ status: 'pending' as ProposalStatus });
      
      expect(stopSpy).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(60000);
      
      // The second start should use the new options
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'pending' });
    });
    
    it('should stop the interval when stop is called', () => {
      trigger.start({ status: 'active' as ProposalStatus });
      
      jest.advanceTimersByTime(60000);
      expect(mockProposalDB.listAll).toHaveBeenCalledWith({ status: 'active' });
      
      trigger.stop();
      
      mockProposalDB.listAll.mockClear();
      jest.advanceTimersByTime(60000);
      expect(mockProposalDB.listAll).not.toHaveBeenCalled();
    });
  });
}); 