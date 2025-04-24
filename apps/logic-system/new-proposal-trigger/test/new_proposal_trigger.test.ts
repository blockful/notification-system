import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { new_proposal_trigger_logic } from '../src/new_proposal_trigger';
import { Proposal_Repository, Proposal_On_Chain } from '../src/interfaces/proposal_repository';
import { Queue_Repository, Message, Publish_Result } from '../src/interfaces/queue_repository';

describe('New Proposal Trigger Logic', () => {
  // Test constants
  const TRIGGER_ID = 'new_proposal_trigger';
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
  let mock_queue_repository: jest.Mocked<Queue_Repository>;

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

    const publish_message_mock = jest.fn().mockImplementation(
      (message: Message): Promise<Publish_Result> => Promise.resolve(success_result)
    );

    mock_queue_repository = {
      publish_message: publish_message_mock
    } as jest.Mocked<Queue_Repository>;

    jest.clearAllMocks();
  });

  describe('Success scenarios', () => {
    it('should process active proposals correctly', async () => {
      mock_proposal_repository.list_all.mockResolvedValue([mock_active_proposal]);
      
      const result = await new_proposal_trigger_logic(mock_proposal_repository, mock_queue_repository);
      
      expect(result).toBe(MESSAGES.SUCCESS);
      expect(mock_proposal_repository.list_all).toHaveBeenCalledWith({ status: 'active' });
      expect(mock_queue_repository.publish_message).toHaveBeenCalledTimes(1);
      expect(mock_queue_repository.publish_message).toHaveBeenCalledWith({
        trigger_id: TRIGGER_ID,
        context: JSON.stringify([serialized_active_proposal])
      });
    });

    it('should return no proposals message when no active proposals exist', async () => {
      mock_proposal_repository.list_all.mockResolvedValue([]);
      
      const result = await new_proposal_trigger_logic(mock_proposal_repository, mock_queue_repository);
      
      expect(result).toBe(MESSAGES.NO_PROPOSALS);
      expect(mock_queue_repository.publish_message).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw error when proposal repository fails', async () => {
      const error = new Error('Database connection failed');
      mock_proposal_repository.list_all.mockRejectedValue(error);
      
      await expect(new_proposal_trigger_logic(mock_proposal_repository, mock_queue_repository))
        .rejects
        .toThrow(error);
      
      expect(mock_queue_repository.publish_message).not.toHaveBeenCalled();
    });

    it('should throw error when queue repository fails', async () => {
      mock_proposal_repository.list_all.mockResolvedValue([mock_active_proposal]);
      mock_queue_repository.publish_message.mockResolvedValue(failure_result);
      
      await expect(new_proposal_trigger_logic(mock_proposal_repository, mock_queue_repository))
        .rejects
        .toThrow(failure_result.error);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined values in proposal list', async () => {
      mock_proposal_repository.list_all.mockResolvedValue([null, mock_active_proposal, undefined] as any);
      
      const result = await new_proposal_trigger_logic(mock_proposal_repository, mock_queue_repository);
      
      expect(result).toBe(MESSAGES.SUCCESS);
      expect(mock_queue_repository.publish_message).toHaveBeenCalledWith({
        trigger_id: TRIGGER_ID,
        context: JSON.stringify([serialized_active_proposal])
      });
    });
  });
});

