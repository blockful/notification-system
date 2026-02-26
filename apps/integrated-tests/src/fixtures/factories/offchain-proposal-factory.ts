/**
 * @notice Data structure for offchain (Snapshot) proposals in integration tests
 * @dev Matches the shape returned by AnticaptureClient.listOffchainProposals
 */
export interface OffchainProposalData {
  id: string;
  daoId: string;
  title: string;
  discussion: string;
  state: string;
  created: number;
}

/**
 * @notice Factory class for creating test offchain proposal data
 * @dev Provides methods to generate Snapshot-style proposal objects for integration testing
 */
export class OffchainProposalFactory {
  /**
   * @notice Creates a single offchain proposal with default or custom data
   * @param daoId The DAO ID this proposal belongs to
   * @param proposalId Unique identifier for the proposal
   * @param overrides Optional partial data to override defaults
   * @return Complete OffchainProposalData object ready for testing
   */
  static createProposal(
    daoId: string,
    proposalId: string,
    overrides?: Partial<OffchainProposalData>,
  ): OffchainProposalData {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 5;

    return {
      id: proposalId,
      daoId,
      title: `Test Snapshot Proposal ${proposalId}`,
      discussion: '',
      state: 'active',
      created: futureTimestamp,
      ...overrides,
    };
  }

  /**
   * @notice Creates multiple offchain proposals for the same DAO
   * @param daoId The DAO ID all proposals belong to
   * @param count Number of proposals to create
   * @param baseId Base string for proposal IDs (will append -1, -2, etc.)
   * @return Array of OffchainProposalData objects with sequential IDs
   */
  static createMultipleProposals(
    daoId: string,
    count: number,
    baseId: string = 'snap-proposal',
  ): OffchainProposalData[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return Array.from({ length: count }, (_, index) =>
      this.createProposal(daoId, `${baseId}-${index + 1}`, {
        created: baseTime + index * 10,
      }),
    );
  }
}
