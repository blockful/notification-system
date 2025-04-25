/**
 * Represents a proposal in the dB
 */
export interface ProposalOnChain {
    /** Unique identifier of the proposal */
    id: string;
    /** DAO identifier this proposal belongs to */
    daoId: string;
    /** Account that created the proposal */
    proposerAccountId: string;
    /** List of contract addresses to call */
    targets: string[];
    /** List of values (in wei) to send with each call */
    values: string[];
    /** List of function signatures to call */
    signatures: string[];
    /** Encoded parameters for each function call */
    calldatas: string[];
    /** Block number when voting starts */
    startBlock: number;
    /** Block number when voting ends */
    endBlock: number;
    /** Human readable description of the proposal */
    description: string;
    /** ISO timestamp of proposal creation */
    timestamp: string;
    /** Current status of the proposal */
    status: ProposalStatus;
    /** Number of votes in favor (in wei) */
    forVotes: bigint;
    /** Number of votes against (in wei) */
    againstVotes: bigint;
    /** Number of abstain votes (in wei) */
    abstainVotes: bigint;
}

/**
 * Valid status values for a proposal
 */
export type ProposalStatus = 
    | 'pending'
    | 'active'
    | 'succeeded'
    | 'defeated'
    | 'executed'
    | 'canceled'
    | 'queued'
    | 'expired';

/**
 * Options for listing proposals
 */
export interface ListProposalsOptions {
    /** Number of proposals to skip */
    offset?: number;
    /** Maximum number of proposals to return */
    limit?: number;
    /** Filter by status */
    status?: ProposalStatus;
    /** Filter by DAO */
    daoId?: string;
}

/**
 * Interface for accessing proposal data from the database
 */
export interface ProposalDB {
    /**
     * Retrieves a proposal by its ID
     * @param id - The proposal ID
     * @returns The proposal if found, null otherwise
     */
    getById(id: string): Promise<ProposalOnChain | null>;

    /**
     * Lists proposals with pagination and filtering
     * @param options - Listing options for pagination and filtering
     * @returns Array of proposals matching the criteria
     */
    listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]>;
} 