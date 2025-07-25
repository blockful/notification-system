import type { GetProposalByIdQuery } from '@notification-system/anticapture-client';

export type ProposalOnChain = GetProposalByIdQuery['proposalsOnchain'];
export type ProposalOrNull = ProposalOnChain | null;

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
    /** Filter by status (using GraphQL string type) */
    status?: string;
    /** Filter by DAO */
    daoId?: string;
}

/**
 * Interface for accessing proposal data from the database
 */
export interface ProposalDataSource {
    /**
     * Retrieves a proposal by its ID
     * @param id - The proposal ID
     * @returns The proposal if found, null/undefined otherwise
     */
    getById(id: string): Promise<ProposalOrNull>;

    /**
     * Lists proposals with pagination and filtering
     * @param options - Listing options for pagination and filtering
     * @returns Array of proposals matching the criteria
     */
    listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]>;
}

/**
 * Interface for finished proposals (internal use in Logic System)
 * Contains all data needed for processing, sorting, and tracking
 */
export interface ProposalFinished {
    id: string;
    daoId: string;
    description: string;
    startBlock: string;
    startTimestamp: number;
    endBlock: string;
    endTimestamp: number;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    blockTime: number;
    timestamp: number;
}

/**
 * Interface for proposal finished notifications (sent to Dispatcher)
 * Contains only essential data needed for notification generation
 */
export interface ProposalFinishedNotification {
    id: string;
    daoId: string;
    description: string;
    endTimestamp: number;
} 