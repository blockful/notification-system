import { v4 as uuidv4 } from 'uuid';

export interface VoteData {
  proposalId: string;
  voterAddress: string;
  daoId: string;
  support: number;
  reason?: string | null;
  timestamp: number;
  transactionHash: string;
  votingPower: string;
  proposalTitle: string;
}

/**
 * Factory for creating vote test data
 */
export class VoteFactory {
  /**
   * Creates a vote for testing
   * @param voterAddress The address of the voter
   * @param proposalId The proposal being voted on
   * @param daoId The DAO identifier
   * @param overrides Optional field overrides
   * @returns Vote data object
   */
  static createVote(
    voterAddress: string,
    proposalId: string,
    daoId: string,
    overrides: Partial<VoteData> = {}
  ): VoteData {
    return {
      proposalId,
      voterAddress,
      daoId,
      support: 1,
      timestamp: Math.floor(Date.now() / 1000),
      transactionHash: `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      votingPower: '1000000000000000000',
      proposalTitle: 'Test Proposal',
      reason: null,
      ...overrides
    };
  }

  /**
   * Creates multiple votes for different proposals
   * @param voterAddress The address of the voter
   * @param proposalIds Array of proposal IDs to vote on
   * @param daoId The DAO identifier
   * @returns Array of vote data objects
   */
  static createVotesForProposals(
    voterAddress: string,
    proposalIds: string[],
    daoId: string
  ): VoteData[] {
    return proposalIds.map(proposalId =>
      this.createVote(voterAddress, proposalId, daoId)
    );
  }

  /**
   * Creates votes from multiple voters for a single proposal
   * @param voterAddresses Array of voter addresses
   * @param proposalId The proposal being voted on
   * @param daoId The DAO identifier
   * @returns Array of vote data objects
   */
  static createVotesFromMultipleVoters(
    voterAddresses: string[],
    proposalId: string,
    daoId: string
  ): VoteData[] {
    return voterAddresses.map(voterAddress =>
      this.createVote(voterAddress, proposalId, daoId)
    );
  }
}