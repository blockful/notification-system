// ProposalOnChain now uses GraphQL types directly  
import type { GetProposalByIdQuery } from '../gql/graphql';
export type ProposalOnChain = GetProposalByIdQuery['proposalsOnchains']['items'][0];
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
export interface ProposalDB {
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