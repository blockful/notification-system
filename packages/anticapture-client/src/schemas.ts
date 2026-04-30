import type { HistoricalVotingPower, OffchainProposal, OffchainVote } from '@anticapture/client';

export enum FeedEventType {
  Delegation = 'DELEGATION',
  Proposal = 'PROPOSAL',
  ProposalExtended = 'PROPOSAL_EXTENDED',
  Transfer = 'TRANSFER',
  Vote = 'VOTE',
}

export enum FeedRelevance {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM',
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

export function processProposals(
  data: { proposals: { items: any[]; totalCount: number } | null },
  daoId: string
) {
  const items = data.proposals?.items ?? [];
  return items.filter((p): p is NonNullable<typeof p> => p !== null).map(p => ({
    ...p,
    daoId,
  }));
}

export function processVotingPowerHistory(
  data: { historicalVotingPower: { items: HistoricalVotingPower[] } | null },
  daoId: string,
  chainId?: number
): ProcessedVotingPowerHistory[] {
  const items = data.historicalVotingPower?.items ?? [];
  return items
    .filter(item => item.accountId)
    .map(item => ({
      ...item,
      daoId,
      changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
      sourceAccountId: item.transfer?.from || item.delegation?.from || '',
      targetAccountId: item.accountId,
      previousDelegate: item.delegation?.previousDelegate || null,
      newDelegate: item.delegation?.to || null,
      ...(chainId !== undefined && { chainId }),
    }));
}
