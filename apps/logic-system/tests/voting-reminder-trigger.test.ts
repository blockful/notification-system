/**
 * @fileoverview Tests for VotingReminderTrigger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mocked } from 'vitest';
import { VotingReminderTrigger } from '../src/triggers/voting-reminder-trigger';
import { VotingReminderProposal, VotingReminderDataSource } from '../src/interfaces/voting-reminder.interface';
import { DispatcherService } from '../src/interfaces/dispatcher.interface';
import { NotificationTypeId } from '@notification-system/messages';

describe('VotingReminderTrigger', () => {
  let trigger: VotingReminderTrigger;
  let mockDispatcherService: Mocked<DispatcherService>;
  let mockDataSource: Mocked<VotingReminderDataSource>;

  const baseTime = Math.floor(Date.now() / 1000);

  beforeEach(() => {
    mockDispatcherService = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    };

    mockDataSource = {
      listActiveForReminder: vi.fn().mockResolvedValue([]),
    };

    // Mock Date.now for consistent testing
    vi.spyOn(Date, 'now').mockReturnValue(baseTime * 1000);

    trigger = new VotingReminderTrigger(
      mockDispatcherService,
      mockDataSource,
      30000, // 30 second interval for testing
      90 // 90% threshold
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create trigger with unique IDs including threshold', () => {
      const trigger30 = new VotingReminderTrigger(mockDispatcherService, mockDataSource, 30000, 30);
      const trigger60 = new VotingReminderTrigger(mockDispatcherService, mockDataSource, 30000, 60);
      const trigger90 = new VotingReminderTrigger(mockDispatcherService, mockDataSource, 30000, 90);
      const trigger75 = new VotingReminderTrigger(mockDispatcherService, mockDataSource, 30000, 75);

      expect(trigger30.id).toBe(NotificationTypeId.VotingReminder30);
      expect(trigger60.id).toBe(NotificationTypeId.VotingReminder60);
      expect(trigger90.id).toBe(NotificationTypeId.VotingReminder90);
      expect(trigger75.id).toBe('voting-reminder-75');
    });

    it('should create trigger with custom prefix', () => {
      const offchainTrigger = new VotingReminderTrigger(
        mockDispatcherService,
        mockDataSource,
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

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should send reminder for eligible proposals within window', async () => {
      const proposalStart = baseTime - 3600; // Started 1 hour ago
      const proposalEnd = baseTime + 300; // Ends in 5 minutes
      // Total duration: 65 minutes, elapsed: 60 minutes = 92.3% elapsed (within 90-95% window)

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        title: 'Test Proposal',
        description: 'A test proposal for voting reminder',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
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
      });
    });

    it('should not send reminder for proposals outside window', async () => {
      const proposalStart = baseTime - 9600; // Started 160 minutes ago
      const proposalEnd = baseTime + 400; // Ends in ~6.7 minutes
      // Total duration: 166.7 minutes, elapsed: 160 minutes = 96% elapsed (> 95% window)

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'A test proposal for voting reminder',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip proposals without required timestamps', async () => {
      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal without timestamps',
        startTime: 0,
        endTime: 0,
        // Missing valid startTime and endTime (0 is falsy)
      };

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip proposals that have already ended', async () => {
      const proposalStart = baseTime - 7200; // Started 2 hours ago
      const proposalEnd = baseTime - 1800; // Ended 30 minutes ago

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that ended',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip proposals that have not started yet', async () => {
      const proposalStart = baseTime + 3600; // Starts in 1 hour
      const proposalEnd = baseTime + 7200; // Ends in 2 hours

      const proposal: VotingReminderProposal = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that has not started',
        startTime: proposalStart,
        endTime: proposalEnd,
      };

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('fetchData', () => {
    it('should fetch active proposals from data source', async () => {
      const proposals: VotingReminderProposal[] = [
        { id: 'prop-1', daoId: 'dao-1', startTime: 1000, endTime: 2000 },
        { id: 'prop-2', daoId: 'dao-1', startTime: 1000, endTime: 2000 }
      ];
      mockDataSource.listActiveForReminder.mockResolvedValue(proposals);
      const result = await trigger['fetchData']();
      expect(mockDataSource.listActiveForReminder).toHaveBeenCalled();
      expect(result).toEqual(proposals);
    });
  });

  describe('time calculation', () => {
    it('should calculate time elapsed percentage correctly', () => {
      const percentage = trigger['calculateTimeElapsedPercentage'](1000, 2000, 1500);
      expect(percentage).toBe(50); // 50% elapsed
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
