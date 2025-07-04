import { AxiosInstance } from 'axios';
import type { GetProposalByIdQuery, ListProposalsQuery, ListProposalsQueryVariables } from './gql/graphql';
type ProposalItems = ListProposalsQuery['proposalsOnchains']['items'];
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
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems>;
}
export {};
