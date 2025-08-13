/**
 * Unit tests for NewProposalTrigger
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NewProposalTrigger } from '../src/triggers/new-proposal-trigger';
import { ProposalOnChain } from '../src/interfaces/proposal.interface';
import { createProposal, createMockDispatcherService, createMockProposalDataSource } from './mocks';

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
    it('should process empty array by sending empty events', async () => {
      await trigger.process([]);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'new-proposal',
        events: []
      });
    });

    it('should send proposals directly without transformation', async () => {
      const proposals: ProposalOnChain[] = [
        createProposal({ status: 'ACTIVE' }),
        createProposal({ id: '2', status: 'ACTIVE', description: 'Second proposal\nWith details' })
      ];
      
      await trigger.process(proposals);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'new-proposal',
        events: proposals
      });
    });

    it('should send complete proposal objects including all fields', async () => {
      const proposal = createProposal({ description: 'Main Title\nDetailed description' });
      
      await trigger.process([proposal]);
      
      expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
        triggerId: 'new-proposal',
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

    it('should start the interval and fetch proposals with correct status', () => {
      trigger.start({ status: 'ACTIVE' });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
    
    it('should stop and restart the interval if start is called twice', () => {
      const stopSpy = jest.spyOn(trigger, 'stop');
      trigger.start({ status: 'ACTIVE' });
      trigger.start({ status: 'ACTIVE' });
      expect(stopSpy).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ status: 'ACTIVE' });
    });
    
    it('should stop the interval when stop is called', () => {
      trigger.start({ status: 'ACTIVE' });
      jest.advanceTimersByTime(60000);
      
      expect(mockProposalDataSource.listAll).toHaveBeenCalledTimes(1);
      expect(mockProposalDataSource.listAll).toHaveBeenCalledWith({ status: 'ACTIVE' });
      
      mockProposalDataSource.listAll.mockClear();
      trigger.stop();
      
      jest.advanceTimersByTime(60000);
      expect(mockProposalDataSource.listAll).not.toHaveBeenCalled();
    });
  });
}); 