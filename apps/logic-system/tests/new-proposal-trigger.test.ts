import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ProposalOnChain } from '../src/interfaces/proposal.interface';
import { NotificationTypeId } from '@notification-system/messages';
import { onchainProposalStatusListEnum } from '@notification-system/anticapture-client';
import { createProposal } from './fixtures';
import { SimpleDispatcherService, SimpleProposalDataSource } from './simple-doubles';

describe('NewProposalTrigger', () => {
  let dispatcherService: SimpleDispatcherService;
  let proposalDataSource: SimpleProposalDataSource;
  let trigger: NewProposalTrigger;

  beforeEach(() => {
    dispatcherService = new SimpleDispatcherService();
    proposalDataSource = new SimpleProposalDataSource();

    trigger = new NewProposalTrigger(
      dispatcherService,
      proposalDataSource,
      60000
    );
  });

  describe('process', () => {
    it('should not send message when array is empty', async () => {
      await trigger.process([]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should send proposals and update timestampCursor', async () => {
      const proposals: ProposalOnChain[] = [
        createProposal({ status: 'ACTIVE', timestamp: 1000 }),
        createProposal({ id: '2', status: 'ACTIVE', description: 'Second proposal\nWith details', timestamp: 900 })
      ];

      await trigger.process(proposals);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.NewProposal,
        events: proposals
      }]);

      // +1 to avoid duplicates since API uses >= comparison
      expect(trigger['timestampCursor']).toBe(1001);
    });

    it('should send complete proposal objects including all fields', async () => {
      const proposal = createProposal({ description: 'Main Title\nDetailed description' });

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.NewProposal,
        events: [proposal]
      }]);
    });

    it('should propagate errors from dispatcher service', async () => {
      const errorMessage = 'Connection failed';
      dispatcherService.sendError = new Error(errorMessage);

      const proposal = createProposal();
      await expect(trigger.process([proposal])).rejects.toThrow(errorMessage);
    });
  });

  describe('start and stop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      proposalDataSource.listAllResult = [createProposal()];
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw error if status option is not provided', async () => {
      const fetchDataMethod = trigger['fetchData'].bind(trigger);
      await expect(fetchDataMethod({})).rejects.toThrow('Status is required in filter options');
    });

    it('should start the interval and fetch proposals with status and timestamp filter', () => {
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: onchainProposalStatusListEnum.ACTIVE });
      vi.advanceTimersByTime(60000);

      expect(proposalDataSource.listAllCalls).toEqual([
        { status: 'ACTIVE', fromDate: initialTimestamp }
      ]);
    });

    it('should stop and restart the interval if start is called twice', () => {
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: onchainProposalStatusListEnum.ACTIVE });
      trigger.start({ status: onchainProposalStatusListEnum.ACTIVE });
      vi.advanceTimersByTime(60000);

      // Only one call: the second start() cancelled the first interval.
      // Without that cancellation we'd see two calls here.
      expect(proposalDataSource.listAllCalls).toEqual([
        { status: 'ACTIVE', fromDate: initialTimestamp }
      ]);
    });

    it('should stop the interval when stop is called', () => {
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: onchainProposalStatusListEnum.ACTIVE });
      vi.advanceTimersByTime(60000);

      expect(proposalDataSource.listAllCalls).toEqual([
        { status: 'ACTIVE', fromDate: initialTimestamp }
      ]);

      const callsBeforeStop = [...proposalDataSource.listAllCalls];
      trigger.stop();

      vi.advanceTimersByTime(60000);
      expect(proposalDataSource.listAllCalls).toEqual(callsBeforeStop);
    });
  });

  describe('initialTimestamp parameter', () => {
    it('should use provided initial timestamp', () => {
      const customTimestamp = '1234567890';
      const customTrigger = new NewProposalTrigger(
        dispatcherService,
        proposalDataSource,
        60000,
        customTimestamp
      );

      expect(customTrigger['timestampCursor']).toBe(parseInt(customTimestamp, 10));
    });

    it('should use default timestamp when not provided', () => {
      const defaultTrigger = new NewProposalTrigger(
        dispatcherService,
        proposalDataSource,
        60000
      );

      const now = Math.floor(Date.now() / 1000);
      const triggerTimestamp = defaultTrigger['timestampCursor'];
      const difference = now - triggerTimestamp;

      // Allow 5 seconds tolerance for test execution time
      expect(difference).toBeGreaterThanOrEqual(86395); // 24 hours - 5 seconds
      expect(difference).toBeLessThanOrEqual(86405); // 24 hours + 5 seconds
    });
  });
});
