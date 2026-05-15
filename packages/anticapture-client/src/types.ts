import type { HistoricalVotingPower, OffchainProposal, OffchainVote } from '@anticapture/client';

export type OffchainProposalItem = OffchainProposal;
export type OffchainVoteItem = OffchainVote;

// SDK now types these as bigint; the wrapper normalizes them back to decimal strings.
export type ProcessedVotingPowerHistory = Omit<HistoricalVotingPower, 'timestamp' | 'votingPower' | 'delta'> & {
  timestamp: string;
  votingPower: string;
  delta: string;
  changeType: 'delegation' | 'transfer' | 'other';
  sourceAccountId: string;
  targetAccountId: string;
  previousDelegate: string | null;
  newDelegate: string | null;
  chainId?: number;
};
