/**
 * Unit tests for ProposalFinishedTrigger
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ProposalFinishedTrigger } from '../src/triggers/proposal-finished-trigger';
import { createMockDispatcherService, createMockProposalFinishedRepository, mockProposalFinishedData } from './mocks';

describe('ProposalFinishedTrigger', () => {
  let trigger: ProposalFinishedTrigger;
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockProposalFinishedRepository: ReturnType<typeof createMockProposalFinishedRepository>;
  let mockDateNow: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now to have a predictable timestamp for all tests
    const mockNow = 1625000000000; // July 1, 2021 in milliseconds
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(mockNow);
    
    mockDispatcherService = createMockDispatcherService();
    mockProposalFinishedRepository = createMockProposalFinishedRepository();
    trigger = new ProposalFinishedTrigger(
      mockProposalFinishedRepository as any,
      mockDispatcherService as any,
      5000 // 5 second interval for testing
    );
    
    // Set the timestamp to a known value for consistent testing
    (trigger as any).lastNotifiedProposalTimestamp = 1625000000; // July 1, 2021
  });

  afterEach(() => {
    mockDateNow.mockRestore();
  });

  describe('Initial state', () => {
    it('should initialize with 7-day lookback timestamp', () => {
      // Mock Date.now to have a predictable timestamp
      const mockNow = 1625000000000; // July 1, 2021 in milliseconds
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      // Create a new trigger instance to test initialization
      const newTrigger = new ProposalFinishedTrigger(
        mockProposalFinishedRepository as any,
        mockDispatcherService as any,
        5000
      );
      
      // Should initialize with 7 days ago from current time
      const expectedTimestamp = Math.floor(mockNow / 1000) - (7 * 24 * 60 * 60); // 7 days ago
      const lastNotified = (newTrigger as any).lastNotifiedProposalTimestamp;
      
      expect(lastNotified).toBe(expectedTimestamp);
      
      mockDateNow.mockRestore();
    });
  });

  describe('fetchData', () => {
    it('should call getFinishedProposalsSince with lastNotifiedProposalTimestamp', async () => {
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValue([] as never);
      
      // Set a timestamp to test the timestamp functionality
      (trigger as any).lastNotifiedProposalTimestamp = 1625000000;
      
      await (trigger as any).fetchData();
      
      expect(mockProposalFinishedRepository.getFinishedProposalsSince).toHaveBeenCalledWith(1625000000);
    });

    it('should fetch data using current timestamp', async () => {
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValue([] as never);
      
      await (trigger as any).fetchData();
      
      // Should use the current lastNotifiedProposalTimestamp value
      expect(mockProposalFinishedRepository.getFinishedProposalsSince).toHaveBeenCalledWith(
        (trigger as any).lastNotifiedProposalTimestamp
      );
    });
  });

  describe('process', () => {
    it('should do nothing when data is empty', async () => {
      await trigger.process([]);
      
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message with correct format when data exists', async () => {
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

    it('should update timestamp to the maximum timestamp', async () => {
      await trigger.process(mockProposalFinishedData);
      
      // Should update to max timestamp
      const lastNotified = (trigger as any).lastNotifiedProposalTimestamp;
      expect(lastNotified).toBe(1625100000); // Max timestamp from mock data
    });

    it('should handle single item correctly', async () => {
      const singleItem = [mockProposalFinishedData[0]];
      
      await trigger.process(singleItem);
      
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
      
      const lastNotified = (trigger as any).lastNotifiedProposalTimestamp;
      expect(lastNotified).toBe(1625000000); // timestamp of first item
    });

    it('should maintain existing timestamp when processing older proposals', async () => {
      // Set initial timestamp higher than mock data
      (trigger as any).lastNotifiedProposalTimestamp = 1625200000;
      
      await trigger.process(mockProposalFinishedData);
      
      // Should maintain higher timestamp
      const lastNotified = (trigger as any).lastNotifiedProposalTimestamp;
      expect(lastNotified).toBe(1625200000);
    });
  });

  describe('Incremental Processing Flow', () => {
    it('should process incrementally across multiple executions', async () => {
      // First execution
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce([mockProposalFinishedData[0]] as never);
      
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      
      // Second execution - should use updated timestamp
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce([mockProposalFinishedData[1]] as never);
      
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(2);
      
      // Verify the second call used the updated timestamp
      const secondCallArgs = mockProposalFinishedRepository.getFinishedProposalsSince.mock.calls[1][0];
      expect(secondCallArgs).toBe(1625000000); // timestamp from first execution
    });

    it('should not process when no new data available', async () => {
      // First execution with data
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce(mockProposalFinishedData as never);
      
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      // Second execution with no new data
      mockProposalFinishedRepository.getFinishedProposalsSince.mockResolvedValueOnce([] as never);
      
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      // Should have called sendMessage only once (from first execution)
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockProposalFinishedRepository.getFinishedProposalsSince.mockRejectedValue(new Error('API Error') as never);
      
      await expect((trigger as any).fetchData()).rejects.toThrow('API Error');
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle dispatcher errors gracefully', async () => {
      mockDispatcherService.sendMessage.mockRejectedValue(new Error('Dispatcher Error'));
      
      await expect(trigger.process(mockProposalFinishedData)).rejects.toThrow('Dispatcher Error');
    });
  });
});