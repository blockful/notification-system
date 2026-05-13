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
