/**
 * Represents a proposal in the dB
 */
export interface Proposal_On_Chain {
    /** Unique identifier of the proposal */
    id: string;
    /** DAO identifier this proposal belongs to */
    dao_id: string;
    /** Account that created the proposal */
    proposer_account_id: string;
    /** List of contract addresses to call */
    targets: string[];
    /** List of values (in wei) to send with each call */
    values: string[];
    /** List of function signatures to call */
    signatures: string[];
    /** Encoded parameters for each function call */
    calldatas: string[];
    /** Block number when voting starts */
    start_block: number;
    /** Block number when voting ends */
    end_block: number;
    /** Human readable description of the proposal */
    description: string;
    /** ISO timestamp of proposal creation */
    timestamp: string;
    /** Current status of the proposal */
    status: ProposalStatus;
    /** Number of votes in favor (in wei) */
    for_votes: bigint;
    /** Number of votes against (in wei) */
    against_votes: bigint;
    /** Number of abstain votes (in wei) */
    abstain_votes: bigint;
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
export interface List_Proposals_Options {
    /** Number of proposals to skip */
    offset?: number;
    /** Maximum number of proposals to return */
    limit?: number;
    /** Filter by status */
    status?: ProposalStatus;
    /** Filter by DAO */
    dao_id?: string;
}

/**
 * Repository interface for accessing proposal data
 */
export interface Proposal_Repository {
    /**
     * Retrieves a proposal by its ID
     * @param id - The proposal ID
     * @returns The proposal if found, null otherwise
     */
    getById(id: string): Promise<Proposal_On_Chain | null>;

    /**
     * Lists proposals with pagination and filtering
     * @param options - Listing options for pagination and filtering
     * @returns Array of proposals matching the criteria
     */
    listAll(options?: List_Proposals_Options): Promise<Proposal_On_Chain[]>;
}