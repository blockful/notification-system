/**
 * @fileoverview Tests for VotingReminderTrigger
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { VotingReminderTrigger } from '../src/triggers/voting-reminder-trigger';
import { ProposalOnChain } from '../src/interfaces/proposal.interface';
import { DispatcherService, DispatcherMessage } from '../src/interfaces/dispatcher.interface';
import { MockedFunction } from 'jest-mock';

describe('VotingReminderTrigger', () => {
  let trigger: VotingReminderTrigger;
  let mockDispatcherService: jest.Mocked<DispatcherService>;
  let mockProposalRepository: any;

  const baseTime = Math.floor(Date.now() / 1000);
  
  beforeEach(() => {
    mockDispatcherService = {
      sendMessage: jest.fn().mockResolvedValue(undefined as never) as MockedFunction<DispatcherService['sendMessage']>,
    };

    mockProposalRepository = {
      listAll: jest.fn().mockResolvedValue([] as never),
    };

    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(baseTime * 1000);
    
    trigger = new VotingReminderTrigger(
      mockDispatcherService,
      mockProposalRepository,
      30000, // 30 second interval for testing
      90 // 90% threshold
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create trigger with unified ID regardless of threshold', () => {
      const trigger30 = new VotingReminderTrigger(mockDispatcherService, mockProposalRepository, 30000, 30);
      const trigger60 = new VotingReminderTrigger(mockDispatcherService, mockProposalRepository, 30000, 60);
      const trigger90 = new VotingReminderTrigger(mockDispatcherService, mockProposalRepository, 30000, 90);
      const trigger75 = new VotingReminderTrigger(mockDispatcherService, mockProposalRepository, 30000, 75);
      
      expect(trigger30.id).toBe('voting-reminder');
      expect(trigger60.id).toBe('voting-reminder');
      expect(trigger90.id).toBe('voting-reminder');
      expect(trigger75.id).toBe('voting-reminder');
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
      
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        title: 'Test Proposal',
        description: 'A test proposal for voting reminder',
        timestamp: proposalStart.toString(),
        endTimestamp: proposalEnd.toString(),
        status: 'ACTIVE'
      } as ProposalOnChain;

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'voting-reminder',
        events: [{
          id: 'proposal-123',
          daoId: 'test-dao',
          title: 'Test Proposal',
          description: 'A test proposal for voting reminder',
          startTimestamp: proposalStart,
          endTimestamp: proposalEnd,
          timeElapsedPercentage: 92.31,
          thresholdPercentage: 90
        }]
      });
    });

    it('should not send reminder for proposals outside window', async () => {
      const proposalStart = baseTime - 9600; // Started 160 minutes ago
      const proposalEnd = baseTime + 400; // Ends in ~6.7 minutes
      // Total duration: 166.7 minutes, elapsed: 160 minutes = 96% elapsed (> 95% window)
      
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'A test proposal for voting reminder',
        timestamp: proposalStart.toString(),
        endTimestamp: proposalEnd.toString(),
        status: 'ACTIVE'
      } as ProposalOnChain;

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should update lastProcessedTimestamp after processing', async () => {
      const proposalStart = baseTime - 3600;
      const proposalEnd = baseTime + 300; // within 90-95% window
      
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal',
        timestamp: proposalStart.toString(),
        endTimestamp: proposalEnd.toString(),
        status: 'ACTIVE'
      } as ProposalOnChain;

      // Process proposal
      await trigger.process([proposal]);
      
      // Check that lastProcessedTimestamp was updated to the proposal's timestamp
      const updatedTimestamp = (trigger as any).lastProcessedTimestamp;
      expect(updatedTimestamp).toBe(proposalStart.toString());
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should skip proposals without required timestamps', async () => {
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal without timestamps',
        status: 'ACTIVE'
        // Missing startTimestamp and endTimestamp
      } as ProposalOnChain;

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip proposals that have already ended', async () => {
      const proposalStart = baseTime - 7200; // Started 2 hours ago
      const proposalEnd = baseTime - 1800; // Ended 30 minutes ago
      
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that ended',
        timestamp: proposalStart.toString(),
        endTimestamp: proposalEnd.toString(),
        status: 'ACTIVE'
      } as ProposalOnChain;

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should skip proposals that have not started yet', async () => {
      const proposalStart = baseTime + 3600; // Starts in 1 hour
      const proposalEnd = baseTime + 7200; // Ends in 2 hours
      
      const proposal: ProposalOnChain = {
        id: 'proposal-123',
        daoId: 'test-dao',
        description: 'Test proposal that has not started',
        timestamp: proposalStart.toString(),
        endTimestamp: proposalEnd.toString(),
        status: 'ACTIVE'
      } as ProposalOnChain;

      await trigger.process([proposal]);

      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('fetchData', () => {
    it('should fetch active proposals with fromDate filter', async () => {
      const proposals = [
        { id: 'prop-1', status: 'ACTIVE' },
        { id: 'prop-2', status: 'ACTIVE' }
      ] as ProposalOnChain[];

      mockProposalRepository.listAll.mockResolvedValue(proposals);

      const result = await trigger['fetchData']({ thresholdPercentage: 90 });

      // Should include fromDate filter with lastProcessedTimestamp
      expect(mockProposalRepository.listAll).toHaveBeenCalledWith({
        status: 'ACTIVE',
        fromDate: expect.any(String)
      });
      expect(result).toEqual(proposals);
    });
  });

  describe('reset', () => {
    it('should reset the lastProcessedTimestamp', () => {
      // Create trigger with initial timestamp
      const initialTimestamp = '1000000';
      const triggerWithTimestamp = new VotingReminderTrigger(
        mockDispatcherService,
        mockProposalRepository,
        30000,
        90,
        5,
        initialTimestamp
      );

      // Reset without timestamp - should default to 24 hours ago
      triggerWithTimestamp.reset();
      
      // Access private property for testing
      const resetTimestamp = (triggerWithTimestamp as any).lastProcessedTimestamp;
      const twentyFourHoursAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      
      // Should be around 24 hours ago (within 1 second tolerance)
      expect(Math.abs(parseInt(resetTimestamp) - twentyFourHoursAgo)).toBeLessThanOrEqual(1);

      // Reset with specific timestamp
      triggerWithTimestamp.reset('2000000');
      const specificTimestamp = (triggerWithTimestamp as any).lastProcessedTimestamp;
      expect(specificTimestamp).toBe('2000000');
    });
  });

  describe('time calculation', () => {
    it('should calculate time elapsed percentage correctly', () => {
      const startTime = 1000;
      const endTime = 2000;
      const currentTime = 1500;
      
      // Use reflection to access private method for testing
      const calculateTime = (trigger as any).calculateTimeElapsedPercentage;
      const percentage = calculateTime(startTime, endTime, currentTime);
      
      expect(percentage).toBe(50); // 50% elapsed
    });

    it('should return 0 for proposals not yet started', () => {
      const startTime = 2000;
      const endTime = 3000;
      const currentTime = 1000;
      
      const calculateTime = (trigger as any).calculateTimeElapsedPercentage;
      const percentage = calculateTime(startTime, endTime, currentTime);
      
      expect(percentage).toBe(0);
    });

    it('should return 100 for proposals that have ended', () => {
      const startTime = 1000;
      const endTime = 2000;
      const currentTime = 3000;
      
      const calculateTime = (trigger as any).calculateTimeElapsedPercentage;
      const percentage = calculateTime(startTime, endTime, currentTime);
      
      expect(percentage).toBe(100);
    });
  });
});