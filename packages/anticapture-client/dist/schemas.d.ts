import type { HistoricalVotingPower, OffchainProposal, OffchainVote } from '@anticapture/client';
export declare enum FeedEventType {
    Delegation = "DELEGATION",
    Proposal = "PROPOSAL",
    ProposalExtended = "PROPOSAL_EXTENDED",
    Transfer = "TRANSFER",
    Vote = "VOTE"
}
export declare enum FeedRelevance {
    High = "HIGH",
    Low = "LOW",
    Medium = "MEDIUM"
}
export type OffchainProposalItem = OffchainProposal;
export type OffchainVoteItem = OffchainVote;
export type ProcessedVotingPowerHistory = HistoricalVotingPower & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
    previousDelegate: string | null;
    newDelegate: string | null;
    chainId?: number;
};
export declare function processProposals(data: {
    proposals: {
        items: any[];
        totalCount: number;
    } | null;
}, daoId: string): any[];
export declare function processVotingPowerHistory(data: {
    historicalVotingPower: {
        items: HistoricalVotingPower[];
    } | null;
}, daoId: string, chainId?: number): ProcessedVotingPowerHistory[];
