import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NewOffchainProposalTrigger } from '../src/triggers/new-offchain-proposal-trigger';
import {
  OffchainProposal,
  OffchainProposalDataSource,
  ListOffchainProposalsOptions
} from '../src/interfaces/offchain-proposal.interface';
import { DispatcherService, DispatcherMessage } from '../src/interfaces/dispatcher.interface';

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

class SimpleOffchainProposalDataSource implements OffchainProposalDataSource {
  proposals: OffchainProposal[] = [];
  lastOptions?: ListOffchainProposalsOptions;

  async listAll(options?: ListOffchainProposalsOptions): Promise<OffchainProposal[]> {
    this.lastOptions = options;
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

      expect(dispatcher.sentMessages).toHaveLength(0);
    });

    it('should send single proposal with correct triggerId and events', async () => {
      const proposal = createOffchainProposal();

      await trigger.process([proposal]);

      expect(dispatcher.sentMessages).toHaveLength(1);
      expect(dispatcher.sentMessages[0]).toEqual({
        triggerId: 'new-offchain-proposal',
        events: [proposal],
      });
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
      expect(dispatcher.sentMessages[0].events).toHaveLength(2);
      expect(trigger['timestampCursor']).toBe(1700000201);
    });

    it('should propagate dispatcher errors', async () => {
      dispatcher.shouldFail = true;
      const proposal = createOffchainProposal();

      await expect(trigger.process([proposal])).rejects.toThrow('Dispatcher failed');
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      dataSource.proposals = [createOffchainProposal()];
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start interval, fetch data, and process it', () => {
      trigger.start({ status: ['active', 'pending'] });
      jest.advanceTimersByTime(60000);

      expect(dataSource.lastOptions).toBeDefined();
      expect(dataSource.lastOptions!.status).toEqual(['active', 'pending']);
    });

    it('should stop and clear timer', async () => {
      trigger.start({ status: ['active', 'pending'] });
      await trigger.stop();

      expect(trigger['timer']).toBeNull();

      jest.advanceTimersByTime(120000);
      expect(dataSource.lastOptions).toBeUndefined();
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
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

      trigger.reset();

      const expected = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      expect(trigger['timestampCursor']).toBe(expected);

      jest.useRealTimers();
    });
  });

  describe('fetchData', () => {
    it('should pass fromDate as current cursor to data source', async () => {
      const customTrigger = new NewOffchainProposalTrigger(
        dispatcher, dataSource, 60000, '1700000000'
      );

      await customTrigger['fetchData']({ status: ['active'] });

      expect(dataSource.lastOptions?.fromDate).toBe(1700000000);
    });

    it('should pass status from options', async () => {
      await trigger['fetchData']({ status: ['active', 'pending'] });

      expect(dataSource.lastOptions?.status).toEqual(['active', 'pending']);
    });
  });
});
