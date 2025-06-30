import { AxiosInstance } from 'axios';
import type { GetProposalByIdQuery, ListProposalsQuery, ListProposalsQueryVariables } from './gql/graphql';
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
     * Fetches a single proposal by ID with full type safety
     */
    getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null>;
    /**
     * Lists proposals with optional filtering and pagination with full type safety
     */
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ListProposalsQuery['proposalsOnchains']['items']>;
}
