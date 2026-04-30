import type { FeedEventType, FeedRelevance, OffchainProposalItem, OffchainVoteItem, ProcessedVotingPowerHistory } from './schemas';
export interface AnticaptureClientConfig {
    baseURL: string;
    defaultHeaders?: Record<string, string>;
    maxRetries?: number;
    timeoutMs?: number;
}
export type VoteWithDaoId = {
    daoId: string;
    [key: string]: any;
};
export type OffchainVoteWithDaoId = {
    daoId: string;
    [key: string]: any;
};
export declare class AnticaptureClient {
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
    getProposalById(id: string): Promise<any | null>;
    listProposals(variables?: any, daoId?: string): Promise<any[]>;
    listVotingPowerHistory(variables?: any, daoId?: string): Promise<ProcessedVotingPowerHistory[]>;
    listVotes(daoId: string, variables?: any): Promise<any[]>;
    getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<any[]>;
    getOffchainProposalNonVoters(proposalId: string, addresses?: string[]): Promise<{
        voter: string;
        votingPower?: string;
    }[]>;
    listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
    getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
    listOffchainProposals(variables?: any, daoId?: string): Promise<(OffchainProposalItem & {
        daoId: string;
    })[]>;
    listOffchainVotes(daoId: string, variables?: any): Promise<OffchainVoteItem[]>;
    listRecentOffchainVotesFromAllDaos(fromDate: number, limit?: number): Promise<OffchainVoteWithDaoId[]>;
}
