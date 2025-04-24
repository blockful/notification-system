import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { NewProposalTrigger } from '../src/new_proposal_trigger';
import { Proposal_Repository, Proposal_On_Chain } from '../src/interfaces/proposal_repository';
import { Queue_Repository, Message, Publish_Result } from '../src/interfaces/queue_repository';

describe('New Proposal Trigger', () => {
  // Test constants
  const TRIGGER_ID = 'new_proposal_trigger';
  const INTERVAL = 1000; // 1 second
  const MESSAGES = {
    SUCCESS: 'New proposal sent to the queue.',
    NO_PROPOSALS: 'There are no new proposals.'
  };

  // Mock data
  const mock_active_proposal: Proposal_On_Chain = {
    id: "1",
    dao_id: "dao1",
    proposer_account_id: "proposer1",
    targets: ["0x123"],
    values: ["0"],
    signatures: ["signature1"],
    calldatas: ["0x0"],
    start_block: 100,
    end_block: 200,
    description: "First proposal",
    timestamp: "2024-03-20T10:00:00Z",
    status: "active",
    for_votes: BigInt("100"),
    against_votes: BigInt("50"),
    abstain_votes: BigInt("10")
  };

  // Serialized version for test assertions
  const serialized_active_proposal = {
    ...mock_active_proposal,
    for_votes: "100",
    against_votes: "50",
    abstain_votes: "10"
  };

  const success_result: Publish_Result = {
    success: true
  };

  const failure_result: Publish_Result = {
    success: false,
    error: 'Queue service unavailable'
  };

  // Repository mocks
  let mock_proposal_repository: jest.Mocked<Proposal_Repository>;
  let mock_queue_repository: Queue_Repository;
  let trigger: NewProposalTrigger;

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mock_proposal_repository = {
      get_by_id: jest.fn(),
      list_all: jest.fn()
    } as jest.Mocked<Proposal_Repository>;

    mock_queue_repository = {
      publish_message: jest.fn().mockImplementation(
        () => Promise.resolve(success_result)
      )
    } as Queue_Repository;

    trigger = new NewProposalTrigger(
      mock_queue_repository,
      INTERVAL
    );

    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should process active proposals correctly', async () => {
      const data = [mock_active_proposal];
      
      const filteredData = await trigger.filter(data, { status: 'active' });
      const result = await trigger.process(filteredData);
      
      expect(result).toBe(MESSAGES.SUCCESS);
      expect(mock_queue_repository.publish_message).toHaveBeenCalledTimes(1);
      expect(mock_queue_repository.publish_message).toHaveBeenCalledWith({
        trigger_id: TRIGGER_ID,
        context: JSON.stringify([serialized_active_proposal])
      });
    });

    it('should return no proposals message when no active proposals exist', async () => {
      const data: Proposal_On_Chain[] = [];
      
      const filteredData = await trigger.filter(data, { status: 'active' });
      const result = await trigger.process(filteredData);
      
      expect(result).toBe(MESSAGES.NO_PROPOSALS);
      expect(mock_queue_repository.publish_message).not.toHaveBeenCalled();
    });

    it('should filter out non-active proposals', async () => {
      const inactiveProposal = { ...mock_active_proposal, status: 'executed' as const };
      const data = [inactiveProposal, mock_active_proposal];
      
      const filteredData = await trigger.filter(data, { status: 'active' });
      
      expect(filteredData).toHaveLength(1);
      expect(filteredData[0]).toEqual(mock_active_proposal);
    });

    it('should filter by any provided status', async () => {
      const executedProposal = { ...mock_active_proposal, status: 'executed' as const };
      const data = [executedProposal, mock_active_proposal];
      
      const filteredData = await trigger.filter(data, { status: 'executed' });
      
      expect(filteredData).toHaveLength(1);
      expect(filteredData[0]).toEqual(executedProposal);
    });

    it('should throw error when status is not provided', async () => {
      const data = [mock_active_proposal];
      
      await expect(trigger.filter(data)).rejects.toThrow('Status is required in filter options');
    });
  });

  describe('Error handling', () => {
    it('should throw error when queue repository fails', async () => {
      jest.spyOn(mock_queue_repository, 'publish_message').mockResolvedValue(failure_result);
      
      const data = [mock_active_proposal];
      const filteredData = await trigger.filter(data, { status: 'active' });
      
      await expect(trigger.process(filteredData))
        .rejects
        .toThrow(failure_result.error);
    });
  });

  describe('Trigger configuration', () => {
    it('should be configured with correct ID and interval', () => {
      expect(trigger.id).toBe(TRIGGER_ID);
      expect(trigger.interval).toBe(INTERVAL);
    });
  });
});

