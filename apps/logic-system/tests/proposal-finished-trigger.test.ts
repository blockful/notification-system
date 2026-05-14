import { describe, it, expect, beforeEach } from 'vitest';
import { ProposalFinishedTrigger } from '../src/triggers/proposal-finished-trigger';
import { NotificationTypeId } from '@notification-system/messages';
import {
  createProposal,
  createFinishedProposal,
  createProposalWithMissingFields,
  DEFAULT_INTERVAL,
} from './fixtures';
import {
  SimpleDispatcherService,
  SimpleProposalDataSource,
} from './simple-doubles';

describe('ProposalFinishedTrigger', () => {
  let trigger: ProposalFinishedTrigger;
  let dispatcherService: SimpleDispatcherService;
  let proposalRepository: SimpleProposalDataSource;

  beforeEach(() => {
    dispatcherService = new SimpleDispatcherService();
    proposalRepository = new SimpleProposalDataSource();

    trigger = new ProposalFinishedTrigger(
      proposalRepository,
      dispatcherService,
      DEFAULT_INTERVAL
    );
  });

  describe('Data Fetching', () => {
    it('should fetch proposals with finished statuses and temporal filter', async () => {
      const initialTimestamp = trigger['endTimestampCursor'];

      await trigger['fetchData']();

      expect(proposalRepository.listAllCalls).toEqual([{
        status: ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'],
        fromEndDate: initialTimestamp,
        orderDirection: 'desc',
        limit: 100
      }]);
    });

    it('should return fetched proposals', async () => {
      const mockProposals = [
        createFinishedProposal('EXECUTED', { id: '1' }),
        createFinishedProposal('DEFEATED', { id: '2' })
      ];
      proposalRepository.listAllResult = mockProposals;

      const result = await trigger['fetchData']();

      expect(result).toEqual(mockProposals);
    });
  });

  describe('Event Processing', () => {
    describe('when no proposals exist', () => {
      it('should not send any messages', async () => {
        await trigger.process([]);

        expect(dispatcherService.sentMessages).toEqual([]);
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

        expect(dispatcherService.sentMessages).toEqual([{
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
        }]);

        // Cursor advances to first proposal's endTimestamp + 1 (data is desc-ordered)
        expect(trigger['endTimestampCursor']).toBe(1625097601);
      });

      it('should handle proposals with missing optional fields', async () => {
        const proposal = createProposalWithMissingFields();
        proposal.id = 'prop1';

        await trigger.process([proposal]);

        expect(dispatcherService.sentMessages).toEqual([{
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
        }]);
      });

      it('should send all proposals in a single batch message', async () => {
        const proposals = Array.from({ length: 5 }, (_, i) =>
          createProposal({ id: `prop${i}`, status: 'EXECUTED' })
        );

        await trigger.process(proposals);

        expect(dispatcherService.sentMessages).toHaveLength(1);
        expect(dispatcherService.sentMessages[0].triggerId).toBe(NotificationTypeId.ProposalFinished);
        expect(dispatcherService.sentMessages[0].events.map((e: any) => e.id))
          .toEqual(['prop0', 'prop1', 'prop2', 'prop3', 'prop4']);
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
        proposalRepository.listAllResult = [proposalA];
        await trigger['fetchData']();
        await trigger.process([proposalA]);

        expect(trigger['endTimestampCursor']).toBe(2001);

        // Second execution: query should use fromEndDate=2001 so A is not refetched
        proposalRepository.listAllResult = [proposalB];
        const secondFetchResult = await trigger['fetchData']();

        expect(proposalRepository.listAllCalls.at(-1)).toEqual({
          status: ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'],
          fromEndDate: 2001,
          orderDirection: 'desc',
          limit: 100
        });

        expect(secondFetchResult).toEqual([proposalB]);

        await trigger.process([proposalB]);
        expect(dispatcherService.sentMessages.at(-1)?.events).toEqual([
          {
            id: 'proposal-b',
            daoId: 'dao1',
            description: 'Test proposal',
            endTimestamp: 2100,
            status: 'DEFEATED',
            forVotes: '1000000000000000000000',
            againstVotes: '500000000000000000000',
            abstainVotes: '100000000000000000000'
          }
        ]);
      });
    });

    describe('Error Handling', () => {
      it('should propagate errors from dispatcher service', async () => {
        const proposal = createFinishedProposal('EXECUTED', { id: 'prop1' });
        dispatcherService.sendError = new Error('Network error');

        await expect(trigger.process([proposal])).rejects.toThrow('Network error');
      });
    });
  });
});
