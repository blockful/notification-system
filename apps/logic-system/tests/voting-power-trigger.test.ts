import { describe, it, expect, beforeEach } from 'vitest';
import { VotingPowerChangedTrigger } from '../src/triggers/voting-power-changed-trigger';
import { NotificationTypeId } from '@notification-system/messages';
import { createVotingPowerHistory, mockVotingPowerData } from './fixtures';
import {
  SimpleDispatcherService,
  SimpleVotingPowerRepository,
  SimpleThresholdRepository,
} from './simple-doubles';

describe('VotingPowerChangedTrigger', () => {
  let trigger: VotingPowerChangedTrigger;
  let dispatcherService: SimpleDispatcherService;
  let votingPowerRepository: SimpleVotingPowerRepository;
  let thresholdRepository: SimpleThresholdRepository;

  beforeEach(() => {
    dispatcherService = new SimpleDispatcherService();
    votingPowerRepository = new SimpleVotingPowerRepository();
    thresholdRepository = new SimpleThresholdRepository();
    // Fail-open by default
    thresholdRepository.defaultThreshold = null;
    trigger = new VotingPowerChangedTrigger(
      dispatcherService,
      votingPowerRepository,
      thresholdRepository,
      5000
    );
  });

  describe('Initial state', () => {
    it('should initialize with current timestamp', () => {
      const trigger2 = new VotingPowerChangedTrigger(
        new SimpleDispatcherService(),
        new SimpleVotingPowerRepository(),
        new SimpleThresholdRepository(),
        5000
      );

      const lastProcessed = trigger2['lastProcessedTimestamp'];

      expect(lastProcessed.toString().slice(0, -3)).toBe(Math.floor(Date.now() / 1000).toString().slice(0, -3));
    });
  });

  describe('fetchData', () => {
    it('should call listVotingPowerHistory with timestamp for incremental processing', async () => {
      trigger['lastProcessedTimestamp'] = '1625000000';

      await trigger['fetchData']();

      expect(votingPowerRepository.listCalls).toEqual(['1625000000']);
    });
  });

  describe('process', () => {
    it('should do nothing when data is empty', async () => {
      await trigger.process([]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should send message with correct format when data exists', async () => {
      await trigger.process(mockVotingPowerData);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events: mockVotingPowerData
      }]);
    });

    it('should update timestamp to the last item in array + 1 second', async () => {
      await trigger.process(mockVotingPowerData);

      expect(trigger['lastProcessedTimestamp']).toBe('1625184001');
    });

    it('should handle single item correctly', async () => {
      const singleItem = [mockVotingPowerData[0]];

      await trigger.process(singleItem);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events: singleItem
      }]);
      expect(trigger['lastProcessedTimestamp']).toBe('1625097601');
    });
  });

  describe('Incremental Processing Flow', () => {
    it('should process incrementally across multiple executions', async () => {
      votingPowerRepository.resultQueue = [
        [mockVotingPowerData[0]],
        [mockVotingPowerData[1]],
      ];

      let data = await trigger['fetchData']();
      await trigger.process(data);

      expect(dispatcherService.sentMessages).toHaveLength(1);

      data = await trigger['fetchData']();
      await trigger.process(data);

      expect(dispatcherService.sentMessages).toHaveLength(2);

      // Second call must use the timestamp updated after the first process()
      expect(votingPowerRepository.listCalls[1]).toBe('1625097601');
    });

    it('should not process when no new data available', async () => {
      votingPowerRepository.resultQueue = [mockVotingPowerData, []];

      let data = await trigger['fetchData']();
      await trigger.process(data);

      data = await trigger['fetchData']();
      await trigger.process(data);

      // Empty second batch produces no extra message
      expect(dispatcherService.sentMessages).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      votingPowerRepository.defaultResult = new Error('API Error');

      await expect(trigger['fetchData']()).rejects.toThrow('API Error');
      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should handle dispatcher errors gracefully', async () => {
      dispatcherService.sendError = new Error('Dispatcher Error');

      await expect(trigger.process(mockVotingPowerData)).rejects.toThrow('Dispatcher Error');
    });
  });

  describe('Threshold Filtering', () => {
    it('should drop delegation events below threshold', async () => {
      thresholdRepository.defaultThreshold = '500';

      const events = [
        createVotingPowerHistory({ delta: '100', changeType: 'delegation', timestamp: '1000' }),
        createVotingPowerHistory({ delta: '600', changeType: 'delegation', timestamp: '1001' }),
      ];

      await trigger.process(events);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events: [events[1]]
      }]);
    });

    it('should drop transfer events below threshold', async () => {
      thresholdRepository.defaultThreshold = '200';

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

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events: [events[1]]
      }]);
    });

    it('should use abs(delta) for negative deltas', async () => {
      thresholdRepository.defaultThreshold = '200';

      const events = [
        createVotingPowerHistory({ delta: '-300', changeType: 'delegation', timestamp: '1000' }),
        createVotingPowerHistory({ delta: '-50', changeType: 'delegation', timestamp: '1001' }),
      ];

      await trigger.process(events);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events: [events[0]]
      }]);
    });

    it('should pass all events through when threshold is null (fail-open)', async () => {
      thresholdRepository.defaultThreshold = null;

      const events = [
        createVotingPowerHistory({ delta: '1', changeType: 'delegation', timestamp: '1000' }),
      ];

      await trigger.process(events);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingPowerChanged,
        events
      }]);
    });

    it('should always advance timestamp even when all events are filtered', async () => {
      thresholdRepository.defaultThreshold = '99999999';

      const events = [
        createVotingPowerHistory({ delta: '1', changeType: 'delegation', timestamp: '5000' }),
        createVotingPowerHistory({ delta: '2', changeType: 'delegation', timestamp: '6000' }),
      ];

      await trigger.process(events);

      expect(dispatcherService.sentMessages).toEqual([]);
      expect(trigger['lastProcessedTimestamp']).toBe('6001');
    });
  });
});
