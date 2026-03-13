import { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { GetProposalByIdQuery, ListProposalsQuery, ListProposalsQueryVariables, ListHistoricalVotingPowerQueryVariables, ListVotesQuery, ListVotesQueryVariables, ListOffchainProposalsQueryVariables } from './gql/graphql';
import { SafeProposalNonVotersResponseSchema, ProcessedVotingPowerHistory, FeedEventType, FeedRelevance, OffchainProposalItem } from './schemas';
type ProposalItems = NonNullable<ListProposalsQuery['proposals']>['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];
type ProposalNonVoter = z.infer<typeof SafeProposalNonVotersResponseSchema>['proposalNonVoters']['items'][0];
type VoteItem = NonNullable<NonNullable<ListVotesQuery['votes']>['items'][0]>;
export type VoteWithDaoId = VoteItem & {
    daoId: string;
};
export declare class AnticaptureClient {
    private readonly httpClient;
    constructor(httpClient: AxiosInstance, maxRetries?: number, timeout?: number);
    /**
     * Recursively normalizes Ethereum addresses in an object/array structure
     * @param obj - Any value to process
     * @param transformer - Function to transform each detected address
     * @returns The processed value with transformed addresses
     */
    private normalizeAddressesInObject;
    /**
     * Converts addresses to EIP-55 checksum format (for API input - case-sensitive API)
     */
    private toChecksum;
    /**
     * Converts addresses to lowercase (for our system - case-insensitive DB)
     */
    private toLowercase;
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
        alreadySupportCalldataReview: boolean;
    }>>;
    /**
     * Fetches a single proposal by ID with full type safety
     */
    getProposalById(id: string): Promise<GetProposalByIdQuery['proposal'] | null>;
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems>;
    /**
     * Lists voting power history with full type safety
     * Uses the new historicalVotingPower query which properly returns delegation and transfer data
     * @param variables - Query variables for filtering and pagination (fromDate, limit, skip, orderBy, orderDirection, accountId)
     * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
     * @returns Array of voting power history items
     */
    listVotingPowerHistory(variables?: ListHistoricalVotingPowerQueryVariables, daoId?: string): Promise<VotingPowerHistoryItems>;
    /**
     * Fetches votes for specific proposals and voter addresses
     * @param variables Query variables including daoId
     * @returns List of votes matching the criteria
     */
    listVotes(daoId: string, variables?: ListVotesQueryVariables): Promise<VoteItem[]>;
    /**
     * Fetches addresses that haven't voted on a specific proposal
     * Note: API already filters for addresses with votingPower > 0
     * @param proposalId The proposal ID to check
     * @param daoId The DAO ID for the header
     * @param addresses Optional array of addresses to filter by
     * @returns List of non-voters with their voting power details
     */
    getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<ProposalNonVoter[]>;
    /**
     * List recent votes from all DAOs since a given timestamp
     * @param timestampGt Fetch votes with timestamp greater than this value (unix timestamp as string)
     * @param limit Maximum number of votes to fetch per DAO (default: 100)
     * @returns Array of votes from all DAOs with daoId included
     */
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
    /**
     * Fetches the event relevance threshold for a given DAO, event type, and relevance level.
     * Used to filter out low-impact events (e.g., small delegation changes).
     * @returns Threshold as a numeric string, or null if unavailable (fail-open)
     */
    getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
    listOffchainProposals(variables?: ListOffchainProposalsQueryVariables, daoId?: string): Promise<(OffchainProposalItem & {
        daoId: string;
    })[]>;
}
export {};
