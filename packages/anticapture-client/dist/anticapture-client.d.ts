import { AxiosInstance } from 'axios';
import type { FeedEventType, FeedRelevance, ListHistoricalVotingPowerQueryVariables, ListOffchainProposalsQueryVariables, ListOffchainVotesQueryVariables, ListProposalsQueryVariables, ListVotesQueryVariables, OffchainProposalItem, OffchainVoteItem, OnchainProposal, OnchainVote, ProposalNonVoter } from './types';
import { FeedEventType as FeedEventTypeEnum, FeedRelevance as FeedRelevanceEnum, ProcessedVotingPowerHistory } from './schemas';
export type VoteWithDaoId = OnchainVote & {
    daoId: string;
};
export type OffchainVoteWithDaoId = OffchainVoteItem & {
    daoId: string;
};
export declare class AnticaptureClient {
    private readonly httpClient;
    constructor(httpClient: AxiosInstance, maxRetries?: number, timeout?: number);
    private normalizeBaseUrl;
    private normalizeAddressesInObject;
    private toChecksum;
    private toLowercase;
    private serializeParams;
    private request;
    private buildDaoPath;
    getDAOs(): Promise<Array<{
        id: string;
        blockTime: number;
        votingDelay: string;
        chainId: number;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }>>;
    getProposalById(id: string): Promise<OnchainProposal | null>;
    listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<OnchainProposal[]>;
    listVotingPowerHistory(variables?: ListHistoricalVotingPowerQueryVariables, daoId?: string): Promise<ProcessedVotingPowerHistory[]>;
    listVotes(daoId: string, variables?: ListVotesQueryVariables): Promise<OnchainVote[]>;
    getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<ProposalNonVoter[]>;
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
    getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
    listOffchainProposals(variables?: ListOffchainProposalsQueryVariables, daoId?: string): Promise<(OffchainProposalItem & {
        daoId: string;
    })[]>;
    listOffchainVotes(daoId: string, variables?: ListOffchainVotesQueryVariables): Promise<OffchainVoteItem[]>;
    listRecentOffchainVotesFromAllDaos(fromDate: number, limit?: number): Promise<OffchainVoteWithDaoId[]>;
}
export { FeedEventTypeEnum as FeedEventType, FeedRelevanceEnum as FeedRelevance };
