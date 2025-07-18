import { AxiosInstance } from 'axios';
import type { GetProposalByIdQuery, ListProposalsQuery, ListProposalsQueryVariables, ListVotingPowerHistorysQueryVariables } from './gql/graphql';
import { ProcessedVotingPowerHistory } from './schemas';
export type EnrichedDAO = {
    id: string;
    blockTime: number;
    votingDelay: string;
};
type ProposalItems = ListProposalsQuery['proposalsOnchains']['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];
export declare class AnticaptureClient {
    private readonly httpClient;
    constructor(httpClient: AxiosInstance);
    private query;
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO IDs
     */
    getDAOs(): Promise<string[]>;
    /**
     * Fetches all DAOs with enriched data including blockTime
     * @returns Array of enriched DAO objects
     */
    getEnrichedDAOs(): Promise<EnrichedDAO[]>;
    /**
     * Fetches a single proposal by ID with full type safety
     */
    getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null>;
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems>;
    /**
     * Lists voting power history with full type safety
     * @param variables - Query variables for filtering and pagination
     * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
     * @returns Array of voting power history items
     */
    listVotingPowerHistory(variables?: ListVotingPowerHistorysQueryVariables, daoId?: string): Promise<VotingPowerHistoryItems>;
}
export {};
