import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VotingReminderTrigger } from '../src/triggers/voting-reminder-trigger';
import { VotingReminderProposal } from '../src/interfaces/voting-reminder.interface';
import { NotificationTypeId } from '@notification-system/messages';
import {
  SimpleDispatcherService,
  SimpleVotingReminderDataSource,
} from './simple-doubles';

describe('VotingReminderTrigger', () => {
  let trigger: VotingReminderTrigger;
  let dispatcherService: SimpleDispatcherService;
  let dataSource: SimpleVotingReminderDataSource;

  const baseTime = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    dispatcherService = new SimpleDispatcherService();
    dataSource = new SimpleVotingReminderDataSource();

    // Pin Date.now so window math is deterministic.
    vi.spyOn(Date, 'now').mockReturnValue(baseTime * 1000);

    trigger = new VotingReminderTrigger(
      dispatcherService,
      dataSource,
      30000,
      90
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create trigger with unique IDs including threshold', () => {
      const trigger30 = new VotingReminderTrigger(dispatcherService, dataSource, 30000, 30);
      const trigger60 = new VotingReminderTrigger(dispatcherService, dataSource, 30000, 60);
      const trigger90 = new VotingReminderTrigger(dispatcherService, dataSource, 30000, 90);
      const trigger75 = new VotingReminderTrigger(dispatcherService, dataSource, 30000, 75);

      expect(trigger30.id).toBe(NotificationTypeId.VotingReminder30);
      expect(trigger60.id).toBe(NotificationTypeId.VotingReminder60);
      expect(trigger90.id).toBe(NotificationTypeId.VotingReminder90);
      expect(trigger75.id).toBe('voting-reminder-75');
    });

    it('should create trigger with custom prefix', () => {
      const offchainTrigger = new VotingReminderTrigger(
        dispatcherService,
        dataSource,
        30000,
        75,
        5,
        'offchain-voting-reminder'
      );
      expect(offchainTrigger.id).toBe('offchain-voting-reminder-75');
    });
  });

  describe('process', () => {
    it('should not send messages for empty proposals array', async () => {
      await trigger.process([]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should send reminder for eligible proposals within window', async () => {
      const proposalStart = baseTime - 3600;
      const proposalEnd = baseTime + 300;
      // 65min total, 60min elapsed → 92.31% (in [90, 95))

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        title: 'Test Proposal',
        description: 'A test proposal for voting reminder',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([{
        triggerId: NotificationTypeId.VotingReminder90,
        events: [{
          id: 'proposal-123',
          daoId: 'test-dao',
          title: 'Test Proposal',
          description: 'A test proposal for voting reminder',
          startTimestamp: proposalStart,
          endTimestamp: proposalEnd,
          timeElapsedPercentage: 92.31,
          thresholdPercentage: 90,
          link: undefined,
          discussion: undefined,
        }]
      }]);
    });

    it('should not send reminder for proposals outside window', async () => {
      const proposalStart = baseTime - 9600;
      const proposalEnd = baseTime + 400;
      // 96% elapsed → outside [90, 95)

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'A test proposal for voting reminder',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should skip proposals without required timestamps', async () => {
      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal without timestamps',
        startTime: 0,
        endTime: 0,
      };

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should skip proposals that have already ended', async () => {
      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that ended',
        startTime: baseTime - 7200,
        endTime: baseTime - 1800,
      };

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });

    it('should skip proposals that have not started yet', async () => {
      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that has not started',
        startTime: baseTime + 3600,
        endTime: baseTime + 7200,
      };

      await trigger.process([proposal]);

      expect(dispatcherService.sentMessages).toEqual([]);
    });
  });

  describe('fetchData', () => {
    it('should fetch active proposals from data source', async () => {
      const proposals: VotingReminderProposal[] = [
        { id: 'prop-1', daoId: 'dao-1', startTime: 1000, endTime: 2000 },
        { id: 'prop-2', daoId: 'dao-1', startTime: 1000, endTime: 2000 }
      ];
      dataSource.listResult = proposals;

      const result = await trigger['fetchData']();

      expect(dataSource.listCalls).toBe(1);
      expect(result).toEqual(proposals);
    });
  });

  describe('time calculation', () => {
    it('should calculate time elapsed percentage correctly', () => {
      const percentage = trigger['calculateTimeElapsedPercentage'](1000, 2000, 1500);
      expect(percentage).toBe(50);
    });

    it('should return 0 for proposals not yet started', () => {
      const percentage = trigger['calculateTimeElapsedPercentage'](2000, 3000, 1000);
      expect(percentage).toBe(0);
    });

    it('should return 100 for proposals that have ended', () => {
      const percentage = trigger['calculateTimeElapsedPercentage'](1000, 2000, 3000);
      expect(percentage).toBe(100);
    });
  });
});
