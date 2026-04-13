import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ProposalFinishedTrigger } from '../src/triggers/proposal-finished-trigger';
import { ProposalRepository } from '../src/repositories/proposal.repository';
import {
  createMockDispatcherService,
  createProposal,
  createFinishedProposal,
  createProposalWithMissingFields,
  DEFAULT_INTERVAL
} from './mocks';
import { NotificationTypeId } from '@notification-system/messages';

describe('ProposalFinishedTrigger', () => {
  let trigger: ProposalFinishedTrigger;
  let mockDispatcherService: ReturnType<typeof createMockDispatcherService>;
  let mockProposalRepository: jest.Mocked<ProposalRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDispatcherService = createMockDispatcherService();
    mockProposalRepository = {
      listAll: jest.fn(),
      getById: jest.fn()
    } as any;
    
    trigger = new ProposalFinishedTrigger(
      mockProposalRepository,
      mockDispatcherService as any,
      DEFAULT_INTERVAL
    );
  });

  describe('Data Fetching', () => {
    it('should fetch proposals with finished statuses and temporal filter', async () => {
      mockProposalRepository.listAll.mockResolvedValue([]);
      const initialTimestamp = trigger['endTimestampCursor'];
      
      await (trigger as any).fetchData();
      
      expect(mockProposalRepository.listAll).toHaveBeenCalledWith({
        status: ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'],
        fromEndDate: initialTimestamp,
        orderDirection: 'desc',
        limit: 100
      });
    });

    it('should return fetched proposals', async () => {
      const mockProposals = [
        createFinishedProposal('EXECUTED', { id: '1' }),
        createFinishedProposal('DEFEATED', { id: '2' })
      ];
      
      mockProposalRepository.listAll.mockResolvedValue(mockProposals);
      
      const result = await (trigger as any).fetchData();
      
      expect(result).toEqual(mockProposals);
    });
  });

  describe('Event Processing', () => {
    describe('when no proposals exist', () => {
      it('should not send any messages', async () => {
        await trigger.process([]);
        
        expect(mockDispatcherService.sendMessage).not.toHaveBeenCalled();
      });
    });

    describe('when proposals exist', () => {
      it('should send message with correct format and update endTimestampCursor', async () => {
        const proposals = [
          createFinishedProposal('EXECUTED', {
            id: 'prop1',
            daoId: 'dao1',
            description: 'Test proposal 1 description',
            timestamp: 1625097600,
            endTimestamp: 1625097600
          }),
          createFinishedProposal('DEFEATED', {
            id: 'prop2',
            daoId: 'dao2',
            description: 'Test proposal 2 description',
            timestamp: 1625184000,
            endTimestamp: 1625184000,
            forVotes: '200000000000000000000',
            againstVotes: '800000000000000000000',
            abstainVotes: '50000000000000000000'
          })
        ];
        
        await trigger.process(proposals);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: NotificationTypeId.ProposalFinished,
          events: [
            {
              id: 'prop1',
              daoId: 'dao1',
              description: 'Test proposal 1 description',
              endTimestamp: 1625097600,
              status: 'EXECUTED',
              forVotes: '1000000000000000000000',
              againstVotes: '500000000000000000000',
              abstainVotes: '100000000000000000000'
            },
            {
              id: 'prop2',
              daoId: 'dao2',
              description: 'Test proposal 2 description',
              endTimestamp: 1625184000,
              status: 'DEFEATED',
              forVotes: '200000000000000000000',
              againstVotes: '800000000000000000000',
              abstainVotes: '50000000000000000000'
            }
          ]
        });
        
        // Should update to the first notification's endTimestamp + 1 (prop1 is first in array)
        expect(trigger['endTimestampCursor']).toBe(1625097601);
      });

      it('should handle proposals with missing optional fields', async () => {
        const proposal = createProposalWithMissingFields();
        proposal.id = 'prop1';
        
        await trigger.process([proposal]);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: NotificationTypeId.ProposalFinished,
          events: [
            {
              id: 'prop1',
              daoId: 'dao1',
              description: '',
              endTimestamp: 0,
              status: 'unknown',
              forVotes: '0',
              againstVotes: '0',
              abstainVotes: '0'
            }
          ]
        });
      });

      it('should send all proposals in a single batch message', async () => {
        const proposals = Array.from({ length: 5 }, (_, i) =>
          createProposal({ id: `prop${i}`, status: 'EXECUTED' })
        );
        
        await trigger.process(proposals);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledTimes(1);
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            triggerId: NotificationTypeId.ProposalFinished,
            events: expect.arrayContaining([
              expect.objectContaining({ id: 'prop0' }),
              expect.objectContaining({ id: 'prop1' }),
              expect.objectContaining({ id: 'prop2' }),
              expect.objectContaining({ id: 'prop3' }),
              expect.objectContaining({ id: 'prop4' })
            ])
          })
        );
      });
    });

    describe('Bug Fix: Proposals with Different Creation and End Times', () => {
      it('should not lose proposals that were created before but finished after endTimestampCursor', async () => {
        const proposalA = createFinishedProposal('EXECUTED', {
          id: 'proposal-a',
          daoId: 'dao1',
          timestamp: 1000,
          endTimestamp: 2000
        });

        const proposalB = createFinishedProposal('DEFEATED', {
          id: 'proposal-b',
          daoId: 'dao1',
          timestamp: 1100,
          endTimestamp: 2100
        });

        // First execution: process proposal A
        mockProposalRepository.listAll.mockResolvedValueOnce([proposalA]);
        await (trigger as any).fetchData();
        await trigger.process([proposalA]);

        // Verify endTimestampCursor was updated to A's endTimestamp + 1
        expect(trigger['endTimestampCursor']).toBe(2001);

        // Second execution: should fetch proposals with fromEndDate=2001
        // Proposal B should be returned because endTimestamp(2100) >= 2001
        // Proposal A (endTimestamp=2000) will NOT be returned (2000 < 2001)
        mockProposalRepository.listAll.mockResolvedValueOnce([proposalB]);
        const secondFetchResult = await (trigger as any).fetchData();

        // Verify the query uses fromEndDate=2001 (A's endTimestamp + 1)
        // This ensures A is not fetched again, avoiding duplicates
        expect(mockProposalRepository.listAll).toHaveBeenLastCalledWith({
          status: ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'],
          fromEndDate: 2001,  // A's endTimestamp + 1
          orderDirection: 'desc',
          limit: 100
        });

        // Verify proposal B is returned and can be processed
        expect(secondFetchResult).toEqual([proposalB]);

        // Process B and verify it's notified
        await trigger.process([proposalB]);
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            triggerId: NotificationTypeId.ProposalFinished,
            events: expect.arrayContaining([
              expect.objectContaining({
                id: 'proposal-b',
                endTimestamp: 2100
              })
            ])
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('should propagate errors from dispatcher service', async () => {
        const proposal = createFinishedProposal('EXECUTED', { id: 'prop1' });
        mockDispatcherService.sendMessage.mockRejectedValue(new Error('Network error'));
        
        await expect(trigger.process([proposal])).rejects.toThrow('Network error');
      });
    });
  });
});