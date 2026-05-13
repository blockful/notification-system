import type { HistoricalVotingPower, OffchainProposal, OffchainVote } from '@anticapture/client';
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
