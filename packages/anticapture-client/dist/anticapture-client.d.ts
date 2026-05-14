import type { FeedEventType, FeedRelevance, OnchainProposal, OnchainVote, OffchainVote, Voter, OffchainNonVoter, ProposalsQueryParams, VotesQueryParams, OffchainProposalsQueryParams, VotesOffchainQueryParams, HistoricalVotingPowerQueryParams } from '@anticapture/client';
import type { OffchainProposalItem, OffchainVoteItem, ProcessedVotingPowerHistory } from './types';
export interface AnticaptureClientConfig {
    baseURL: string;
    defaultHeaders?: Record<string, string>;
    maxRetries?: number;
    timeoutMs?: number;
}
export type VoteWithDaoId = OnchainVote & {
    daoId: string;
};
export type OffchainVoteWithDaoId = OffchainVote & {
    daoId: string;
};
export type DaoInfo = {
    id: string;
    blockTime: number;
    votingDelay: string;
    chainId: number;
    alreadySupportCalldataReview: boolean;
    supportOffchainData: boolean;
};
/**
 * Public surface of AnticaptureClient — used for dependency injection and mocking.
 */
export interface IAnticaptureClient {
    getDAOs(): Promise<Array<DaoInfo>>;
    getProposalById(id: string): Promise<OnchainProposal | null>;
    listProposals(variables?: ProposalsQueryParams, daoId?: string): Promise<OnchainProposal[]>;
    listVotingPowerHistory(variables?: HistoricalVotingPowerQueryParams, daoId?: string): Promise<ProcessedVotingPowerHistory[]>;
    listVotes(daoId: string, variables?: VotesQueryParams): Promise<OnchainVote[]>;
    getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<Voter[]>;
    getOffchainProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<OffchainNonVoter[]>;
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
    getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
    listOffchainProposals(variables?: OffchainProposalsQueryParams, daoId?: string): Promise<(OffchainProposalItem & {
        daoId: string;
    })[]>;
    listOffchainVotes(daoId: string, variables?: VotesOffchainQueryParams): Promise<OffchainVoteItem[]>;
    listRecentOffchainVotesFromAllDaos(fromDate: number, limit?: number): Promise<OffchainVoteWithDaoId[]>;
}
export declare class AnticaptureClient implements IAnticaptureClient {
    private readonly retries;
    private readonly timeoutMs;
    private readonly sdkConfig;
    constructor(config: AnticaptureClientConfig);
    private call;
    private normalizeAddressesInObject;
    private toChecksum;
    private toLowercase;
    getDAOs(): Promise<Array<{
        id: string;
        blockTime: number;
        votingDelay: string;
        chainId: number;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }>>;
    getProposalById(id: string): Promise<OnchainProposal | null>;
    listProposals(variables?: ProposalsQueryParams, daoId?: string): Promise<OnchainProposal[]>;
    listVotingPowerHistory(variables?: HistoricalVotingPowerQueryParams, daoId?: string): Promise<ProcessedVotingPowerHistory[]>;
    listVotes(daoId: string, variables?: VotesQueryParams): Promise<OnchainVote[]>;
    getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<Voter[]>;
    getOffchainProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<OffchainNonVoter[]>;
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
    getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
    listOffchainProposals(variables?: OffchainProposalsQueryParams, daoId?: string): Promise<(OffchainProposalItem & {
        daoId: string;
    })[]>;
    listOffchainVotes(daoId: string, variables?: VotesOffchainQueryParams): Promise<OffchainVoteItem[]>;
    listRecentOffchainVotesFromAllDaos(fromDate: number, limit?: number): Promise<OffchainVoteWithDaoId[]>;
}
