import { v4 as uuidv4 } from 'uuid';

export interface VoteData {
  id: string;
  proposalId: string;
  voterAccountId: string;
  daoId: string;
  support: string; // Must be string for Zod validation in AntiCapture client
  weight: string;
  reason?: string;
  timestamp: string;
  txHash: string;
  votingPower: string;
}

/**
 * Factory for creating vote test data
 */
export class VoteFactory {
  /**
   * Creates a vote for testing
   * @param voterAccountId The address of the voter
   * @param proposalId The proposal being voted on
   * @param daoId The DAO identifier
   * @param overrides Optional field overrides
   * @returns Vote data object
   */
  static createVote(
    voterAccountId: string,
    proposalId: string,
    daoId: string,
    overrides: Partial<VoteData> = {}
  ): VoteData {
    return {
      id: uuidv4(),
      proposalId,
      voterAccountId,
      daoId,
      support: '1', // '1' = FOR, '0' = AGAINST, '2' = ABSTAIN (must be string for Zod validation)
      weight: '1000000000000000000', // 1 token in wei
      timestamp: new Date().toISOString(),
      txHash: `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 8)}`, // Generate a fake tx hash
      votingPower: '1000000000000000000', // 1 token in wei
      ...overrides
    };
  }

  /**
   * Creates multiple votes for different proposals
   * @param voterAccountId The address of the voter
   * @param proposalIds Array of proposal IDs to vote on
   * @param daoId The DAO identifier
   * @returns Array of vote data objects
   */
  static createVotesForProposals(
    voterAccountId: string,
    proposalIds: string[],
    daoId: string
  ): VoteData[] {
    return proposalIds.map(proposalId => 
      this.createVote(voterAccountId, proposalId, daoId)
    );
  }

  /**
   * Creates votes from multiple voters for a single proposal
   * @param voterAccountIds Array of voter addresses
   * @param proposalId The proposal being voted on
   * @param daoId The DAO identifier
   * @returns Array of vote data objects
   */
  static createVotesFromMultipleVoters(
    voterAccountIds: string[],
    proposalId: string,
    daoId: string
  ): VoteData[] {
    return voterAccountIds.map(voterAccountId =>
      this.createVote(voterAccountId, proposalId, daoId)
    );
  }
}