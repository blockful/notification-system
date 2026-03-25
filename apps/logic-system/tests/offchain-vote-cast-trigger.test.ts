import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { OffchainVoteCastTrigger } from '../src/triggers/offchain-vote-cast-trigger';
import { OffchainVotesRepository } from '../src/repositories/offchain-votes.repository';
import { DispatcherService, DispatcherMessage } from '../src/interfaces/dispatcher.interface';
import { AnticaptureClient, OffchainVoteWithDaoId } from '@notification-system/anticapture-client';

class SimpleDispatcherService implements DispatcherService {
  sentMessages: DispatcherMessage[] = [];

  async sendMessage(message: DispatcherMessage): Promise<void> {
    this.sentMessages.push(message);
  }
}

class StubOffchainVotesRepository extends OffchainVotesRepository {
  constructor() {
    super(new AnticaptureClient(axios.create()));
  }

  override async listRecentOffchainVotes(): Promise<OffchainVoteWithDaoId[]> {
    return [];
  }
}

function createTestVote(overrides?: Partial<OffchainVoteWithDaoId>): OffchainVoteWithDaoId {
  return {
    voter: '0xvoter123',
    created: 1700000000,
    proposalId: 'snap-proposal-1',
    proposalTitle: 'Test Snapshot Proposal',
    reason: '',
    vp: 1500.5,
    daoId: 'test-dao',
    ...overrides,
  };
}

describe('OffchainVoteCastTrigger', () => {
  let dispatcher: SimpleDispatcherService;
  let repository: StubOffchainVotesRepository;
  let trigger: OffchainVoteCastTrigger;

  beforeEach(() => {
    dispatcher = new SimpleDispatcherService();
    repository = new StubOffchainVotesRepository();
    trigger = new OffchainVoteCastTrigger(dispatcher, repository, 60000);
  });

  describe('process()', () => {
    test('should send message with correct triggerId and events', async () => {
      const votes = [
        createTestVote({ created: 1700000001 }),
        createTestVote({ created: 1700000002, proposalId: 'snap-proposal-2' }),
      ];

      await trigger.process(votes);

      expect(dispatcher.sentMessages).toEqual([
        { triggerId: 'offchain-vote-cast', events: votes },
      ]);
    });

    test('should not send message when data is empty', async () => {
      await trigger.process([]);

      expect(dispatcher.sentMessages).toEqual([]);
    });

    test('should advance cursor to last vote created + 1', async () => {
      const votes = [
        createTestVote({ created: 1700000010 }),
        createTestVote({ created: 1700000020, proposalId: 'snap-proposal-2' }),
      ];

      await trigger.process(votes);

      expect(trigger.getLastProcessedTimestamp()).toBe(1700000021);
    });
  });

  describe('reset()', () => {
    test('should set timestamp from string argument', () => {
      trigger.reset('1600000000');

      expect(trigger.getLastProcessedTimestamp()).toBe(1600000000);
    });

    test('should default to current time when no argument', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));

      trigger.reset();

      const expectedTimestamp = Math.floor(new Date('2025-06-15T12:00:00Z').getTime() / 1000);
      expect(trigger.getLastProcessedTimestamp()).toBe(expectedTimestamp);

      jest.useRealTimers();
    });
  });
});
