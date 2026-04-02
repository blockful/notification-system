/**
 * Unit tests for NewProposalTrigger
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ProposalOnChain } from '../src/interfaces/proposal.interface';
import { createProposal, createMockDispatcherService, createMockProposalDataSource } from './mocks';
import { NotificationTypeId } from '@notification-system/messages';
import { QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';

describe('NewProposalTrigger', () => {
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockProposalDataSource: ReturnType<typeof createMockProposalDataSource>;
  let trigger: NewProposalTrigger;

  beforeEach(() => {
    mockDispatcherService = createMockDispatcherService();
    mockProposalDataSource = createMockProposalDataSource();
    
    trigger = new NewProposalTrigger(
      mockDispatcherService,
      mockProposalDataSource,
      60000
    );
  });

  describe('process', () => {
    it('should not send message when array is empty', async () => {
      await trigger.process([]);
      
      expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
    });

    it('should send proposals and update timestampCursor', async () => {
      const proposals: ProposalOnChain[] = [
        createProposal({ status: 'ACTIVE', timestamp: 1000 }),
        createProposal({ id: '2', status: 'ACTIVE', description: 'Second proposal\nWith details', timestamp: 900 })
      ];
      
      await trigger.process(proposals);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: NotificationTypeId.NewProposal,
        events: proposals
      });
      
      // Should update to the first proposal's timestamp + 1 (highest since ordered desc)
      // +1 to avoid duplicates since API uses >= comparison
      expect(trigger['timestampCursor']).toBe(1001);
    });

    it('should send complete proposal objects including all fields', async () => {
      const proposal = createProposal({ description: 'Main Title\nDetailed description' });
      
      await trigger.process([proposal]);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: NotificationTypeId.NewProposal,
        events: [proposal]
      });
    });

    it('should propagate errors from dispatcher service', async () => {
      const errorMessage = 'Connection failed';
      mockDispatcherService.sendMessage.mockRejectedValue(new Error(errorMessage));
      
      const proposal = createProposal();
      await expect(trigger.process([proposal])).rejects.toThrow(errorMessage);
    });
  });
  
  describe('start and stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      const proposal = createProposal();
      mockProposalDataSource.listAll.mockResolvedValue([proposal]);
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should throw error if status option is not provided', async () => {
      const fetchDataMethod = trigger['fetchData'].bind(trigger);
      await expect(fetchDataMethod({})).rejects.toThrow('Status is required in filter options');
    });

    it('should start the interval and fetch proposals with status and timestamp filter', () => {
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: QueryInput_Proposals_Status_Items.Active });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ 
        status: 'ACTIVE',
        fromDate: initialTimestamp 
      });
    });
    
    it('should stop and restart the interval if start is called twice', () => {
      const stopSpy = jest.spyOn(trigger, 'stop');
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: QueryInput_Proposals_Status_Items.Active });
      trigger.start({ status: QueryInput_Proposals_Status_Items.Active });
      expect(stopSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ 
        status: 'ACTIVE',
        fromDate: initialTimestamp 
      });
    });
    
    it('should stop the interval when stop is called', () => {
      const initialTimestamp = trigger['timestampCursor'];
      trigger.start({ status: QueryInput_Proposals_Status_Items.Active });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ 
        status: 'ACTIVE',
        fromDate: initialTimestamp 
      });
      
      mockProposalDataSource.listAll.mockClear();
      trigger.stop();
      
      jest.advanceTimersByTime(60000);
      expect(mockProposalDataSource.listAll).not.toHaveBeenCalled();
    });
  });
  
  describe('initialTimestamp parameter', () => {
    it('should use provided initial timestamp', () => {
      const customTimestamp = '1234567890';
      const customTrigger = new NewProposalTrigger(
        mockDispatcherService,
        mockProposalDataSource,
        60000,
        customTimestamp
      );
      
      expect(customTrigger['timestampCursor']).toBe(parseInt(customTimestamp, 10));
    });
    
    it('should use default timestamp when not provided', () => {
      const defaultTrigger = new NewProposalTrigger(
        mockDispatcherService,
        mockProposalDataSource,
        60000
      );
      
      // Should be a timestamp from ~24 hours ago
      const now = Math.floor(Date.now() / 1000);
      const triggerTimestamp = defaultTrigger['timestampCursor'];
      const difference = now - triggerTimestamp;
      
      // Allow 5 seconds tolerance for test execution time
      expect(difference).toBeGreaterThanOrEqual(86395); // 24 hours - 5 seconds
      expect(difference).toBeLessThanOrEqual(86405); // 24 hours + 5 seconds
    });
  });
}); 