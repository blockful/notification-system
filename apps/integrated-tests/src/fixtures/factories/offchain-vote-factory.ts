/**
 * @notice Data structure for offchain (Snapshot) votes in integration tests
 * @dev Matches the shape returned by AnticaptureClient.listRecentOffchainVotesFromAllDaos
 */
export interface OffchainVoteData {
  voter: string;
  proposalId: string;
  daoId: string;
  created: number;
  proposalTitle: string;
  reason: string;
  vp: number;
}

/**
 * @notice Factory class for creating test offchain vote data
 * @dev Provides methods to generate Snapshot-style vote objects for integration testing
 */
export class OffchainVoteFactory {
  /**
   * @notice Creates a single offchain vote with default or custom data
   * @param voterAddress The address of the voter
   * @param proposalId The Snapshot proposal being voted on
   * @param daoId The DAO identifier
   * @param overrides Optional field overrides
   * @return Complete OffchainVoteData object ready for testing
   */
  static createVote(
    voterAddress: string,
    proposalId: string,
    daoId: string,
    overrides: Partial<OffchainVoteData> = {}
  ): OffchainVoteData {
    return {
      voter: voterAddress,
      proposalId,
      daoId,
      created: Math.floor(Date.now() / 1000),
      proposalTitle: 'Test Snapshot Proposal',
      reason: '',
      vp: 1500.5,
      ...overrides
    };
  }

  /**
   * @notice Creates multiple offchain votes for different proposals
   * @param voterAddress The address of the voter
   * @param proposalIds Array of proposal IDs to vote on
   * @param daoId The DAO identifier
   * @return Array of OffchainVoteData objects
   */
  static createVotesForProposals(
    voterAddress: string,
    proposalIds: string[],
    daoId: string
  ): OffchainVoteData[] {
    return proposalIds.map(proposalId =>
      this.createVote(voterAddress, proposalId, daoId)
    );
  }
}
