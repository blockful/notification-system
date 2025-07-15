/**
 * Unit tests for VotingPowerChangedTrigger
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { VotingPowerChangedTrigger } from '../src/triggers/voting-power-changed-trigger';
import { createMockDispatcherService, createMockVotingPowerRepository, mockVotingPowerData } from './mocks';

describe('VotingPowerChangedTrigger', () => {
  let trigger: VotingPowerChangedTrigger;
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockVotingPowerRepository: ReturnType<typeof createMockVotingPowerRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatcherService = createMockDispatcherService();
    mockVotingPowerRepository = createMockVotingPowerRepository();
    trigger = new VotingPowerChangedTrigger(
      mockDispatcherService,
      mockVotingPowerRepository as any,
      5000 // 5 second interval for testing
    );
  });

  describe('Initial state', () => {
    it('should initialize with current timestamp', () => {
      const trigger2 = new VotingPowerChangedTrigger(
        createMockDispatcherService(),
        createMockVotingPowerRepository() as any,
        5000
      );
      
      // Access private field for testing
      const lastProcessed = (trigger2 as any).lastProcessedTimestamp;
      
      expect(lastProcessed.toString().slice(0, -3)).toBe(Math.floor(Date.now() / 1000).toString().slice(0, -3));
    });
  });

  describe('fetchData', () => {
    it('should call listVotingPowerHistory with timestamp for incremental processing', async () => {
      mockVotingPowerRepository.listVotingPowerHistory.mockResolvedValue([] as never);
      
      // Set a timestamp to test the timestamp functionality
      (trigger as any).lastProcessedTimestamp = '1625000000';
      
      await (trigger as any).fetchData();
      
      expect(mockVotingPowerRepository.listVotingPowerHistory).toHaveBeenCalledWith('1625000000');
    });
  });

  describe('process', () => {
    it('should do nothing when data is empty', async () => {
      await trigger.process([]);
      
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should send message with correct format when data exists', async () => {
      await trigger.process(mockVotingPowerData);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: mockVotingPowerData
      });
    });

    it('should update timestamp to the last item in array', async () => {
      await trigger.process(mockVotingPowerData);
      
      // Should update to timestamp of last item (chronologically last)
      const lastProcessed = (trigger as any).lastProcessedTimestamp;
      expect(lastProcessed).toBe('1625184000'); // Last item timestamp
    });

    it('should handle single item correctly', async () => {
      const singleItem = [mockVotingPowerData[0]];
      
      await trigger.process(singleItem);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: singleItem
      });
      
      const lastProcessed = (trigger as any).lastProcessedTimestamp;
      expect(lastProcessed).toBe('1625097600');
    });
  });

  describe('Incremental Processing Flow', () => {
    it('should process incrementally across multiple executions', async () => {
      // First execution
      mockVotingPowerRepository.listVotingPowerHistory.mockResolvedValueOnce([mockVotingPowerData[0]] as never);
      
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      
      // Second execution - should use updated timestamp
      mockVotingPowerRepository.listVotingPowerHistory.mockResolvedValueOnce([mockVotingPowerData[1]] as never);
      
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(2);
      
      // Verify the second call used the updated timestamp
      const secondCallArgs = mockVotingPowerRepository.listVotingPowerHistory.mock.calls[1][0];
      expect(secondCallArgs).toBe('1625097600'); // Timestamp from first execution
    });

    it('should not process when no new data available', async () => {
      // First execution with data
      mockVotingPowerRepository.listVotingPowerHistory.mockResolvedValueOnce(mockVotingPowerData as never);
      
      let data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      // Second execution with no new data
      mockVotingPowerRepository.listVotingPowerHistory.mockResolvedValueOnce([] as never);
      
      data = await (trigger as any).fetchData();
      await trigger.process(data);
      
      // Should have called sendMessage only once (from first execution)
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockVotingPowerRepository.listVotingPowerHistory.mockRejectedValue(new Error('API Error') as never);
      
      await expect((trigger as any).fetchData()).rejects.toThrow('API Error');
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle dispatcher errors gracefully', async () => {
      mockDispatcherService.sendMessage.mockRejectedValue(new Error('Dispatcher Error'));
      
      await expect(trigger.process(mockVotingPowerData)).rejects.toThrow('Dispatcher Error');
    });
  });
});