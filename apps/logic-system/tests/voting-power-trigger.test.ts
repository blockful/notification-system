/**
 * Unit tests for VotingPowerChangedTrigger
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { VotingPowerChangedTrigger } from '../src/triggers/voting-power-changed-trigger';
import { createMockDispatcherService, createMockVotingPowerRepository, createMockThresholdRepository, createVotingPowerHistory, mockVotingPowerData } from './mocks';

describe('VotingPowerChangedTrigger', () => {
  let trigger: VotingPowerChangedTrigger;
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockVotingPowerRepository: ReturnType<typeof createMockVotingPowerRepository>;
  let mockThresholdRepository: ReturnType<typeof createMockThresholdRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatcherService = createMockDispatcherService();
    mockVotingPowerRepository = createMockVotingPowerRepository();
    mockThresholdRepository = createMockThresholdRepository();
    mockThresholdRepository.getThreshold.mockResolvedValue(null);
    trigger = new VotingPowerChangedTrigger(
      mockDispatcherService,
      mockVotingPowerRepository as any,
      mockThresholdRepository as any,
      5000 // 5 second interval for testing
    );
  });

  describe('Initial state', () => {
    it('should initialize with current timestamp', () => {
      const trigger2 = new VotingPowerChangedTrigger(
        createMockDispatcherService(),
        createMockVotingPowerRepository() as any,
        createMockThresholdRepository() as any,
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

    it('should update timestamp to the last item in array + 1 second', async () => {
      await trigger.process(mockVotingPowerData);
      
      // Should update to timestamp of last item (chronologically last)
      const lastProcessed = (trigger as any).lastProcessedTimestamp;
      expect(lastProcessed).toBe('1625184001'); // Last item timestamp + 1
    });

    it('should handle single item correctly', async () => {
      const singleItem = [mockVotingPowerData[0]];
      
      await trigger.process(singleItem);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: singleItem
      });
      
      const lastProcessed = (trigger as any).lastProcessedTimestamp;
      expect(lastProcessed).toBe('1625097601'); // timestamp + 1
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
      expect(secondCallArgs).toBe('1625097601'); // Timestamp from first execution
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
      mockThresholdRepository.getThreshold.mockResolvedValue(null);
      mockDispatcherService.sendMessage.mockRejectedValue(new Error('Dispatcher Error'));
      
      await expect(trigger.process(mockVotingPowerData)).rejects.toThrow('Dispatcher Error');
    });
  });

  describe('Threshold Filtering', () => {
    it('should drop delegation events below threshold', async () => {
      mockThresholdRepository.getThreshold.mockResolvedValue('500');

      const events = [
        createVotingPowerHistory({ delta: '100', changeType: 'delegation', timestamp: '1000' }),
        createVotingPowerHistory({ delta: '600', changeType: 'delegation', timestamp: '1001' }),
      ];

      await trigger.process(events);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: [events[1]]
      });
    });

    it('should drop transfer events below threshold', async () => {
      mockThresholdRepository.getThreshold.mockResolvedValue('200');

      const events = [
        createVotingPowerHistory({
          delta: '50', changeType: 'transfer', timestamp: '1000',
          delegation: null,
          transfer: { from: '0x1', to: '0x2', value: '50' }
        }),
        createVotingPowerHistory({
          delta: '300', changeType: 'transfer', timestamp: '1001',
          delegation: null,
          transfer: { from: '0x1', to: '0x2', value: '300' }
        }),
      ];

      await trigger.process(events);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: [events[1]]
      });
    });

    it('should use abs(delta) for negative deltas', async () => {
      mockThresholdRepository.getThreshold.mockResolvedValue('200');

      const events = [
        createVotingPowerHistory({ delta: '-300', changeType: 'delegation', timestamp: '1000' }),
        createVotingPowerHistory({ delta: '-50', changeType: 'delegation', timestamp: '1001' }),
      ];

      await trigger.process(events);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events: [events[0]]
      });
    });

    it('should pass all events through when threshold is null (fail-open)', async () => {
      mockThresholdRepository.getThreshold.mockResolvedValue(null);

      const events = [
        createVotingPowerHistory({ delta: '1', changeType: 'delegation', timestamp: '1000' }),
      ];

      await trigger.process(events);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-power-changed',
        events
      });
    });

    it('should always advance timestamp even when all events are filtered', async () => {
      mockThresholdRepository.getThreshold.mockResolvedValue('99999999');

      const events = [
        createVotingPowerHistory({ delta: '1', changeType: 'delegation', timestamp: '5000' }),
        createVotingPowerHistory({ delta: '2', changeType: 'delegation', timestamp: '6000' }),
      ];

      await trigger.process(events);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
      expect((trigger as any).lastProcessedTimestamp).toBe('6001');
    });
  });
});