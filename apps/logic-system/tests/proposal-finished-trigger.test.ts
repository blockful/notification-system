import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ProposalFinishedTrigger } from '../src/triggers/proposal-finished-trigger';
import { createMockDispatcherService, createMockProposalFinishedRepository, mockProposalFinishedData } from './mocks';

// Test constants
const MOCK_TIMESTAMP_MS = 1625000000000; // July 1, 2021
const MOCK_TIMESTAMP_SEC = 1625000000;
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
const TEST_INTERVAL = 5000;

describe('ProposalFinishedTrigger', () => {
  let trigger: ProposalFinishedTrigger;
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockProposalFinishedRepository: ReturnType<typeof createMockProposalFinishedRepository>;
  let mockDateNow: jest.SpiedFunction<typeof Date.now>;

  // Helper functions
  const getLastNotifiedTimestamp = (trigger: ProposalFinishedTrigger): number => {
    return (trigger as any).lastNotifiedProposalTimestamp;
  };

  const setLastNotifiedTimestamp = (trigger: ProposalFinishedTrigger, timestamp: number): void => {
    (trigger as any).lastNotifiedProposalTimestamp = timestamp;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(MOCK_TIMESTAMP_MS);
    
    mockDispatcherService = createMockDispatcherService();
    mockProposalFinishedRepository = createMockProposalFinishedRepository();
    trigger = new ProposalFinishedTrigger(
      mockProposalFinishedRepository as any,
      mockDispatcherService as any,
      TEST_INTERVAL
    );
    
    setLastNotifiedTimestamp(trigger, MOCK_TIMESTAMP_SEC);
  });

  afterEach(() => {
    mockDateNow.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with 7-day lookback timestamp', () => {
      const newTrigger = new ProposalFinishedTrigger(
        mockProposalFinishedRepository as any,
        mockDispatcherService as any,
        TEST_INTERVAL
      );
      
      const expectedTimestamp = MOCK_TIMESTAMP_SEC - SEVEN_DAYS_IN_SECONDS;
      
      expect(getLastNotifiedTimestamp(newTrigger)).toBe(expectedTimestamp);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch proposals since last notified timestamp', async () => {
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValue([] as never);
      
      await (trigger as any).fetchData();
      
      expect(mockProposalFinishedRepository.getFinishedProposalsSince).toHaveBeenCalledWith(MOCK_TIMESTAMP_SEC);
    });

    it('should use updated timestamp after processing', async () => {
      const customTimestamp = 1625100000;
      setLastNotifiedTimestamp(trigger, customTimestamp);
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValue([] as never);
      
      await (trigger as any).fetchData();
      
      expect(mockProposalFinishedRepository.getFinishedProposalsSince).toHaveBeenCalledWith(customTimestamp);
    });
  });

  describe('Event Processing', () => {
    describe('when no proposals exist', () => {
      it('should not send any messages', async () => {
        await trigger.process([]);
        
        expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
      });
    });

    describe('when proposals exist', () => {
      it('should send message with correct format', async () => {
        await trigger.process(mockProposalFinishedData);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: 'proposal-finished',
          events: [
            {
              id: 'prop1',
              daoId: 'dao1', 
              description: 'Test proposal 1 description',
              endTimestamp: 1625097600
            },
            {
              id: 'prop2',
              daoId: 'dao1',
              description: 'Test proposal 2 description',
              endTimestamp: 1625184000
            }
          ]
        });
      });

      it('should handle single proposal', async () => {
        const singleProposal = [mockProposalFinishedData[0]];
        
        await trigger.process(singleProposal);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: 'proposal-finished',
          events: [
            {
              id: 'prop1',
              daoId: 'dao1',
              description: 'Test proposal 1 description',
              endTimestamp: 1625097600
            }
          ]
        });
      });
    });
  });

  describe('Timestamp Management', () => {
    it('should update to the latest proposal timestamp', async () => {
      const latestTimestamp = Math.max(...mockProposalFinishedData.map(p => p.timestamp));
      
      await trigger.process(mockProposalFinishedData);
      
      expect(getLastNotifiedTimestamp(trigger)).toBe(latestTimestamp);
    });

    it('should maintain higher timestamp when processing older proposals', async () => {
      const higherTimestamp = 1625200000;
      setLastNotifiedTimestamp(trigger, higherTimestamp);
      
      await trigger.process(mockProposalFinishedData);
      
      expect(getLastNotifiedTimestamp(trigger)).toBe(higherTimestamp);
    });

    it('should update timestamp for single proposal', async () => {
      const singleProposal = [mockProposalFinishedData[0]];
      
      await trigger.process(singleProposal);
      
      expect(getLastNotifiedTimestamp(trigger)).toBe(singleProposal[0].timestamp);
    });
  });

  describe('Incremental Processing', () => {
    it('should process new proposals incrementally', async () => {
      const firstProposal = [mockProposalFinishedData[0]];
      const secondProposal = [mockProposalFinishedData[1]];
      
      // First execution
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce(firstProposal as never);
      
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      expect(getLastNotifiedTimestamp(trigger)).toBe(firstProposal[0].timestamp);
      
      // Second execution with new proposal
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce(secondProposal as never);
      
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockProposalFinishedRepository.getFinishedProposalsSince).toHaveBeenLastCalledWith(firstProposal[0].timestamp);
    });

    it('should skip processing when no new proposals', async () => {
      mockProposalFinishedRepository.getFinishedProposalsSince
        .mockResolvedValueOnce(mockProposalFinishedData as never)
        .mockResolvedValueOnce([] as never);
      
      // First execution with data
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      // Second execution without new data
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('API Error');
      mockProposalFinishedRepository.getFinishedProposalsSince.mockRejectedValue(repositoryError as never);
      
      await expect((trigger as any).fetchData()).rejects.toThrow('API Error');
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should propagate dispatcher errors', async () => {
      const dispatcherError = new Error('Dispatcher Error');
      mockDispatcherService.sendMessage.mockRejectedValue(dispatcherError);
      
      await expect(trigger.process(mockProposalFinishedData)).rejects.toThrow('Dispatcher Error');
    });
  });
});