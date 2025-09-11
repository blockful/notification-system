import { AxiosInstance } from 'axios';
import type { GetProposalByIdQuery, ListProposalsQuery, ListProposalsQueryVariables, ListVotingPowerHistorysQueryVariables, ListVotesOnchainsQuery, ListVotesOnchainsQueryVariables } from './gql/graphql';
import { ProcessedVotingPowerHistory } from './schemas';
type ProposalItems = NonNullable<ListProposalsQuery['proposals']>;
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];
type VotesOnchain = NonNullable<ListVotesOnchainsQuery['votesOnchains']['items'][0]>;
export declare class AnticaptureClient {
    private readonly httpClient;
    constructor(httpClient: AxiosInstance);
    /**
     * Recursively normalizes Ethereum addresses to EIP-55 checksum format
     * Detects addresses by their format using viem's isAddress validation
     * @param obj - Any value to normalize (primitives, objects, arrays, nested structures)
     * @returns The normalized value with checksummed addresses
     */
    private normalizeAddresses;
    private query;
    private buildHeaders;
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO objects with blockTime added
     */
    getDAOs(): Promise<Array<{
        id: string;
        blockTime: number;
        votingDelay: string;
        chainId: number;
    }>>;
    /**
     * Fetches a single proposal by ID with full type safety
     */
    getProposalById(id: string): Promise<GetProposalByIdQuery['proposal'] | null>;
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems>;
    /**
     * Lists voting power history with full type safety
     * @param variables - Query variables for filtering and pagination
     * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
     * @returns Array of voting power history items
     */
    listVotingPowerHistory(variables?: ListVotingPowerHistorysQueryVariables, daoId?: string): Promise<VotingPowerHistoryItems>;
    /**
     * Fetches votes for specific proposals and voter addresses
     * @param variables Query variables including daoId, proposalId_in, voterAccountId_in
     * @returns List of votes matching the criteria
     */
    listVotesOnchains(variables: ListVotesOnchainsQueryVariables): Promise<VotesOnchain[]>;
    /**
     * List recent votes from all DAOs since a given timestamp
     * @param timestampGt Fetch votes with timestamp greater than this value
     * @param limit Maximum number of votes to fetch per DAO (default: 100)
     * @returns Array of votes from all DAOs
     */
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VotesOnchain[]>;
}
export {};
