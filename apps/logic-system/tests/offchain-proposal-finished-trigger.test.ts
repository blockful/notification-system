import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OffchainProposalFinishedTrigger } from '../src/triggers/offchain-proposal-finished-trigger';
import {
  OffchainProposal,
  OffchainProposalDataSource,
  ListOffchainProposalsOptions
} from '../src/interfaces/offchain-proposal.interface';
import { DispatcherService, DispatcherMessage } from '../src/interfaces/dispatcher.interface';

function createClosedOffchainProposal(overrides?: Partial<OffchainProposal>): OffchainProposal {
  return {
    id: 'snap-proposal-1',
    title: 'Test Snapshot Proposal',
    discussion: 'https://forum.example.com/proposal-1',
    link: 'https://snapshot.org/#/test-dao/proposal/snap-proposal-1',
    state: 'closed',
    created: 1700000000,
    end: 1700100000,
    daoId: 'test-dao',
    ...overrides,
  };
}

class SimpleOffchainProposalDataSource implements OffchainProposalDataSource {
  proposals: OffchainProposal[] = [];
  callHistory: ListOffchainProposalsOptions[] = [];

  async listAll(options?: ListOffchainProposalsOptions): Promise<OffchainProposal[]> {
    if (options) this.callHistory.push(options);
    return this.proposals;
  }
}

class SimpleDispatcherService implements DispatcherService {
  sentMessages: DispatcherMessage[] = [];
  shouldFail = false;

  async sendMessage(message: DispatcherMessage): Promise<void> {
    if (this.shouldFail) throw new Error('Dispatcher failed');
    this.sentMessages.push(message);
  }
}

describe('OffchainProposalFinishedTrigger', () => {
  let dataSource: SimpleOffchainProposalDataSource;
  let dispatcher: SimpleDispatcherService;
  let trigger: OffchainProposalFinishedTrigger;

  beforeEach(() => {
    dataSource = new SimpleOffchainProposalDataSource();
    dispatcher = new SimpleDispatcherService();
    trigger = new OffchainProposalFinishedTrigger(dispatcher, dataSource, 60000, '1700000000');
  });

  describe('process()', () => {
    it('should not send message when array is empty', async () => {
      await trigger.process([]);

      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('should send single proposal with correct triggerId and events', async () => {
      const proposal = createClosedOffchainProposal();

      await trigger.process([proposal]);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: 'offchain-proposal-finished',
        events: [proposal],
      }]);
    });

    it('should advance cursor so next fetch uses max end + 1', async () => {
      jest.useFakeTimers();
      const proposals = [
        createClosedOffchainProposal({ id: 'snap-1', end: 1700100200 }),
        createClosedOffchainProposal({ id: 'snap-2', end: 1700100100 }),
      ];

      await trigger.process(proposals);

      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 1700100201,
        orderDirection: 'desc',
        limit: 100,
      });

      await trigger.stop();
      jest.useRealTimers();
    });

    it('should include all proposals in events array', async () => {
      const proposals = [
        createClosedOffchainProposal({ id: 'snap-1', end: 1700100200 }),
        createClosedOffchainProposal({ id: 'snap-2', end: 1700100100 }),
      ];

      await trigger.process(proposals);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: 'offchain-proposal-finished',
        events: proposals,
      }]);
    });

    it('should propagate dispatcher errors', async () => {
      dispatcher.shouldFail = true;
      const proposal = createClosedOffchainProposal();

      await expect(trigger.process([proposal])).rejects.toThrow('Dispatcher failed');
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      dataSource.proposals = [createClosedOffchainProposal()];
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start interval and fetch data with correct options', () => {
      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory).toEqual([{
        status: ['closed'],
        endDate: 1700000000,
        orderDirection: 'desc',
        limit: 100,
      }]);
    });

    it('should stop and not fetch after being stopped', async () => {
      trigger.start();
      await trigger.stop();

      jest.advanceTimersByTime(120000);

      expect(dataSource.callHistory).toEqual([]);
    });
  });

  describe('initialTimestamp & reset', () => {
    it('should use custom initialTimestamp for first fetch', () => {
      jest.useFakeTimers();
      const customTrigger = new OffchainProposalFinishedTrigger(
        dispatcher, dataSource, 60000, '1234567890'
      );

      customTrigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 1234567890,
        orderDirection: 'desc',
        limit: 100,
      });

      customTrigger.stop();
      jest.useRealTimers();
    });

    it('should reset to specific timestamp for next fetch', () => {
      jest.useFakeTimers();
      trigger.reset('9999999999');

      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 9999999999,
        orderDirection: 'desc',
        limit: 100,
      });

      trigger.stop();
      jest.useRealTimers();
    });

    it('should reset to 24h ago when no argument', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      trigger.reset();

      const expected = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

      trigger.start();
      jest.advanceTimersByTime(60000);
      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: expected,
        orderDirection: 'desc',
        limit: 100,
      });

      trigger.stop();
      jest.useRealTimers();
    });
  });

  describe('fetchData via start', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(async () => {
      await trigger.stop();
      jest.useRealTimers();
    });

    it('should fetch with status closed and endDate cursor', () => {
      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 1700000000,
        orderDirection: 'desc',
        limit: 100,
      });
    });

    it('should use updated cursor after processing', async () => {
      const proposal = createClosedOffchainProposal({ end: 1700200000 });
      await trigger.process([proposal]);

      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 1700200001,
        orderDirection: 'desc',
        limit: 100,
      });
    });
  });

  describe('cursor-based deduplication', () => {
    it('should advance cursor so API filters out already-processed proposals', async () => {
      jest.useFakeTimers();
      const proposalA = createClosedOffchainProposal({ id: 'snap-a', end: 1700100000 });
      await trigger.process([proposalA]);

      trigger.start();
      jest.advanceTimersByTime(60000);

      expect(dataSource.callHistory[0]).toEqual({
        status: ['closed'],
        endDate: 1700100001,
        orderDirection: 'desc',
        limit: 100,
      });

      await trigger.stop();
      jest.useRealTimers();
    });

    it('should process new proposals after cursor update', async () => {
      const proposalA = createClosedOffchainProposal({ id: 'snap-a', end: 1700100000 });
      await trigger.process([proposalA]);

      const proposalB = createClosedOffchainProposal({ id: 'snap-b', end: 1700200000 });
      dispatcher.sentMessages = [];
      await trigger.process([proposalB]);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: 'offchain-proposal-finished',
        events: [proposalB],
      }]);
    });
  });
});
