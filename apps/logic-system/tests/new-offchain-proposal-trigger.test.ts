import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NewOffchainProposalTrigger } from '../src/triggers/new-offchain-proposal-trigger';
import { OffchainProposal } from '../src/interfaces/offchain-proposal.interface';
import { NotificationTypeId } from '@notification-system/messages';
import {
  SimpleDispatcherService,
  SimpleOffchainProposalDataSource,
} from './simple-doubles';

function createOffchainProposal(overrides?: Partial<OffchainProposal>): OffchainProposal {
  return {
    id: 'snap-proposal-1',
    title: 'Test Snapshot Proposal',
    discussion: 'https://forum.example.com/proposal-1',
    state: 'active',
    created: 1700000000,
    daoId: 'test-dao',
    ...overrides,
  };
}

describe('NewOffchainProposalTrigger', () => {
  let dataSource: SimpleOffchainProposalDataSource;
  let dispatcher: SimpleDispatcherService;
  let trigger: NewOffchainProposalTrigger;

  beforeEach(() => {
    dataSource = new SimpleOffchainProposalDataSource();
    dispatcher = new SimpleDispatcherService();
    trigger = new NewOffchainProposalTrigger(dispatcher, dataSource, 60000);
  });

  describe('process()', () => {
    it('should not send message when array is empty', async () => {
      await trigger.process([]);

      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('should send single proposal with correct triggerId and events', async () => {
      const proposal = createOffchainProposal();

      await trigger.process([proposal]);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [proposal],
      }]);
    });

    it('should update timestampCursor to data[0].created + 1', async () => {
      const proposal = createOffchainProposal({ created: 1700000000 });

      await trigger.process([proposal]);

      expect(trigger['timestampCursor']).toBe(1700000001);
    });

    it('should include all proposals in events array', async () => {
      const proposals = [
        createOffchainProposal({ id: 'snap-1', created: 1700000200 }),
        createOffchainProposal({ id: 'snap-2', created: 1700000100 }),
      ];

      await trigger.process(proposals);

      expect(dispatcher.sentMessages).toHaveLength(1);
      expect(dispatcher.sentMessages[0].events).toEqual(proposals);
      expect(trigger['timestampCursor']).toBe(1700000201);
    });

    it('should propagate dispatcher errors', async () => {
      dispatcher.sendError = new Error('Dispatcher failed');
      const proposal = createOffchainProposal();

      await expect(trigger.process([proposal])).rejects.toThrow('Dispatcher failed');
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      dataSource.listResult = [createOffchainProposal()];
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start interval, fetch data, and process it', () => {
      trigger.start({ status: ['active', 'pending'] });
      vi.advanceTimersByTime(60000);

      expect(dataSource.listCalls.at(-1)?.status).toEqual(['active', 'pending']);
    });

    it('should stop and clear timer', async () => {
      trigger.start({ status: ['active', 'pending'] });
      await trigger.stop();

      expect(trigger['timer']).toBeNull();

      vi.advanceTimersByTime(120000);
      expect(dataSource.listCalls).toEqual([]);
    });
  });

  describe('initialTimestamp & reset', () => {
    it('should use custom initialTimestamp', () => {
      const customTrigger = new NewOffchainProposalTrigger(
        dispatcher, dataSource, 60000, '1234567890'
      );

      expect(customTrigger['timestampCursor']).toBe(1234567890);
    });

    it('should reset to specific timestamp', () => {
      trigger.reset('9999999999');

      expect(trigger['timestampCursor']).toBe(9999999999);
    });

    it('should reset to 24h ago when no argument', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      trigger.reset();

      const expected = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      expect(trigger['timestampCursor']).toBe(expected);

      vi.useRealTimers();
    });
  });

  describe('fetchData', () => {
    it('should pass fromDate as current cursor to data source', async () => {
      const customTrigger = new NewOffchainProposalTrigger(
        dispatcher, dataSource, 60000, '1700000000'
      );

      await customTrigger['fetchData']({ status: ['active'] });

      expect(dataSource.listCalls.at(-1)?.fromDate).toBe(1700000000);
    });

    it('should pass status from options', async () => {
      await trigger['fetchData']({ status: ['active', 'pending'] });

      expect(dataSource.listCalls.at(-1)?.status).toEqual(['active', 'pending']);
    });
  });
});
