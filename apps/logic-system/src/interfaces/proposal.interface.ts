import type { ListProposalsQuery } from '@notification-system/anticapture-client';
import { QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';

export type ProposalOnChain = NonNullable<NonNullable<ListProposalsQuery['proposals']>['items'][number]>;
export type ProposalOrNull = ProposalOnChain | null;

export type ProposalStatus = QueryInput_Proposals_Status_Items;

/**
 * Options for listing proposals (matches new API parameters)
 */
export interface ListProposalsOptions {
    /** Number of proposals to skip */
    skip?: number;
    /** Maximum number of proposals to return */
    limit?: number;
    /** Filter by status */
    status?: QueryInput_Proposals_Status_Items | QueryInput_Proposals_Status_Items[];
    /** Filter by DAO (passed as header, not query param) */
    daoId?: string;
    /** Filter proposals after this date (timestamp in seconds) */
    fromDate?: number;
    /** Filter proposals by end timestamp (timestamp in seconds) */
    fromEndDate?: number;
    /** Order direction - asc or desc */
    orderDirection?: 'asc' | 'desc';
    /** Whether to include optimistic proposals (true=include, false=exclude, undefined=both) */
    includeOptimisticProposals?: boolean;
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
 * Contains essential data needed for notification generation including voting results
 */
export interface ProposalFinishedNotification {
    id: string;
    daoId: string;
    title?: string;
    description: string;
    endTimestamp: number;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
} 