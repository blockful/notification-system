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
    it('should fetch proposals with finished statuses', async () => {
      mockProposalRepository.listAll.mockResolvedValue([]);
      
      await (trigger as any).fetchData();
      
      expect(mockProposalRepository.listAll).toHaveBeenCalledWith({
        status_in: ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'],
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
      it('should send message with correct format including voting data', async () => {
        const proposals = [
          createFinishedProposal('EXECUTED', {
            id: 'prop1',
            daoId: 'dao1',
            description: 'Test proposal 1 description',
            timestamp: '1625097600'
          }),
          createFinishedProposal('DEFEATED', {
            id: 'prop2',
            daoId: 'dao2',
            description: 'Test proposal 2 description',
            timestamp: '1625184000',
            forVotes: '200000000000000000000',
            againstVotes: '800000000000000000000',
            abstainVotes: '50000000000000000000'
          })
        ];
        
        await trigger.process(proposals);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: 'proposal-finished',
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
      });

      it('should handle proposals with missing optional fields', async () => {
        const proposal = createProposalWithMissingFields();
        // @ts-expect-error - we want to test the case where the proposal is missing some fields
        proposal.id = 'prop1';
        
        await trigger.process([proposal]);
        
        expect(mockDispatcherService.sendMessage).toHaveBeenCalledWith({
          triggerId: 'proposal-finished',
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
            triggerId: 'proposal-finished',
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

    describe('Error Handling', () => {
      it('should propagate errors from dispatcher service', async () => {
        const proposal = createFinishedProposal('EXECUTED', { id: 'prop1' });
        mockDispatcherService.sendMessage.mockRejectedValue(new Error('Network error'));
        
        await expect(trigger.process([proposal])).rejects.toThrow('Network error');
      });
    });
  });
});