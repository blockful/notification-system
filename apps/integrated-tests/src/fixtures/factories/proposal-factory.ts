import { v4 as uuidv4 } from 'uuid';

/**
 * @notice Represents the complete data structure for a DAO proposal
 * @dev Contains all fields necessary for proposal testing and validation
 */
export interface ProposalData {
  /** Unique identifier for the proposal */
  id: string;
  /** ID of the DAO this proposal belongs to */
  daoId: string;
  /** Account ID of the user who created the proposal */
  proposerAccountId: string;
  /** Title of the proposal (extracted from first line of description) */
  title?: string;
  /** Array of contract addresses to call */
  targets: string[];
  /** Array of ETH values to send with each call */
  values: string[];
  /** Array of function signatures to call */
  signatures: string[];
  /** Array of encoded function call data */
  calldatas: string[];
  /** Block number when voting starts */
  startBlock: number;
  /** Block number when voting ends */
  endBlock: number;
  /** Timestamp when proposal ends (in seconds as string) */
  endTimestamp: string;
  /** Human-readable description of the proposal */
  description: string;
  /** Timestamp when proposal was created (in seconds as string) */
  timestamp: string;
  /** Current status of the proposal (PENDING, ACTIVE, etc.) */
  status: string;
  /** Number of votes in favor (as string for big number support) */
  forVotes: string;
  /** Number of votes against (as string for big number support) */
  againstVotes: string;
  /** Number of abstain votes (as string for big number support) */
  abstainVotes: string;
  /** Transaction hash of the proposal creation transaction */
  txHash?: string;
}

/**
 * @notice Factory class for creating test proposal data
 * @dev Provides methods to generate realistic proposal objects for integration testing
 */
export class ProposalFactory {
  /**
   * @notice Creates a single proposal with default or custom data
   * @param daoId The DAO ID this proposal belongs to
   * @param proposalId Unique identifier for the proposal
   * @param overrides Optional partial data to override defaults
   * @return Complete ProposalData object ready for testing
   */
  static createProposal(daoId: string, proposalId: string, overrides?: Partial<ProposalData>): ProposalData {
    const now = Math.floor(Date.now() / 1000) + 1;
    const baseProposal: ProposalData = {
      id: proposalId,
      daoId: daoId,
      proposerAccountId: uuidv4(),
      title: `Test ${daoId} proposal`,
      targets: ['0xtarget1'],
      values: ['0'],
      signatures: ['transfer(address,uint256)'],
      calldatas: ['0xabcdef1234567890'],
      startBlock: 12345678,
      endBlock: 12345978,
      endTimestamp: (now + 300).toString(), // Ends in 5 minutes
      description: `Test ${daoId} proposal`,
      timestamp: now.toString(),
      status: 'ACTIVE',
      forVotes: '1000000000000000000',
      againstVotes: '500000000000000000',
      abstainVotes: '200000000000000000',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ...overrides
    };

    return baseProposal;
  }

  /**
   * @notice Creates multiple proposals for the same DAO
   * @param daoId The DAO ID all proposals belong to
   * @param count Number of proposals to create
   * @param baseId Base string for proposal IDs (will append -1, -2, etc.)
   * @return Array of ProposalData objects with sequential IDs
   */
  static createMultipleProposals(
    daoId: string, 
    count: number, 
    baseId: string = 'proposal'
  ): ProposalData[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return Array.from({ length: count }, (_, index) => 
      this.createProposal(daoId, `${baseId}-${index + 1}`, {
        timestamp: (baseTime + index * 10).toString() // Space out timestamps by 10 seconds each
      })
    );
  }

  /**
   * @notice Creates one proposal for each specified DAO
   * @param daoIds Array of DAO IDs to create proposals for
   * @param proposalId Base proposal ID (will be prefixed with DAO ID)
   * @return Array of ProposalData objects, one per DAO
   */
  static createProposalsForMultipleDaos(
    daoIds: string[], 
    proposalId: string
  ): ProposalData[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return daoIds.map((daoId, index) => 
      this.createProposal(daoId, `${daoId.toLowerCase()}-${proposalId}`, {
        timestamp: (baseTime + index * 10).toString() // Space out timestamps by 10 seconds each
      })
    );
  }
}