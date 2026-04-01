import { z } from 'zod';
import { toLegacyDaoId } from './dao-id';
import type {
  Dao,
  HistoricalVotingPower,
  OffchainProposalItem,
  OffchainVoteItem,
  OnchainProposal,
  OnchainVote,
  ProposalNonVoter,
} from './types';
export { FeedEventType, FeedRelevance } from './types';

export const DaoSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  alreadySupportCalldataReview: z.boolean(),
  supportOffchainData: z.boolean(),
});

export const SafeDaosResponseSchema = z.object({
  items: z.array(DaoSchema),
  totalCount: z.number(),
});

export const OnchainProposalSchema = z.object({
  id: z.string(),
  daoId: z.string(),
  txHash: z.string(),
  proposerAccountId: z.string(),
  title: z.string(),
  description: z.string(),
  startBlock: z.number(),
  endBlock: z.number(),
  timestamp: z.number(),
  status: z.string(),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  startTimestamp: z.number(),
  endTimestamp: z.number(),
  quorum: z.string(),
  calldatas: z.array(z.string()),
  values: z.array(z.string()),
  targets: z.array(z.string()),
  proposalType: z.number().nullable(),
});

export const SafeProposalsResponseSchema = z.object({
  items: z.array(OnchainProposalSchema),
  totalCount: z.number(),
});

export const SafeProposalByIdResponseSchema = OnchainProposalSchema;

const HistoricalVotingPowerItemSchema = z.object({
  accountId: z.string(),
  timestamp: z.string(),
  votingPower: z.string(),
  delta: z.string(),
  daoId: z.string(),
  transactionHash: z.string(),
  logIndex: z.number(),
  delegation: z.object({
    from: z.string(),
    to: z.string(),
    value: z.string(),
    previousDelegate: z.string().nullable(),
  }).nullable(),
  transfer: z.object({
    from: z.string(),
    to: z.string(),
    value: z.string(),
  }).nullable(),
});

export const SafeHistoricalVotingPowerResponseSchema = z.object({
  items: z.array(HistoricalVotingPowerItemSchema),
  totalCount: z.number(),
});

const VoteItemSchema = z.object({
  transactionHash: z.string(),
  proposalId: z.string(),
  voterAddress: z.string(),
  support: z.union([z.string(), z.number()]).transform(String).nullable().optional(),
  votingPower: z.string(),
  timestamp: z.number(),
  reason: z.string().nullable().optional(),
  proposalTitle: z.string().nullable().optional(),
});

export const SafeVotesResponseSchema = z.object({
  items: z.array(VoteItemSchema),
  totalCount: z.number(),
});

const ProposalNonVoterSchema = z.object({
  voter: z.string(),
  votingPower: z.string(),
  lastVoteTimestamp: z.number(),
  votingPowerVariation: z.string(),
});

export const SafeProposalNonVotersResponseSchema = z.object({
  items: z.array(ProposalNonVoterSchema),
  totalCount: z.number(),
});

export const EventThresholdResponseSchema = z.object({
  threshold: z.string(),
});

export const OffchainProposalItemSchema = z.object({
  id: z.string(),
  spaceId: z.string(),
  author: z.string(),
  title: z.string(),
  body: z.string(),
  discussion: z.string(),
  type: z.string(),
  start: z.number(),
  end: z.number(),
  state: z.string(),
  created: z.number(),
  updated: z.number(),
  link: z.string(),
  flagged: z.boolean(),
  scores: z.array(z.number()),
  choices: z.array(z.string()),
  network: z.string(),
  snapshot: z.number().nullable(),
  strategies: z.array(z.object({
    name: z.string(),
    network: z.string(),
    params: z.record(z.unknown()),
  })),
});

export const SafeOffchainProposalsResponseSchema = z.object({
  items: z.array(OffchainProposalItemSchema),
  totalCount: z.number(),
});

export const OffchainVoteItemSchema = z.object({
  voter: z.string(),
  choice: z.union([z.string(), z.number(), z.record(z.number())]),
  created: z.number(),
  proposalId: z.string(),
  proposalTitle: z.string().nullable(),
  reason: z.string(),
  vp: z.number().nullable(),
});

export const SafeOffchainVotesResponseSchema = z.object({
  items: z.array(OffchainVoteItemSchema),
  totalCount: z.number(),
});

export type ProcessedVotingPowerHistory = z.infer<typeof HistoricalVotingPowerItemSchema> & {
  changeType: 'delegation' | 'transfer' | 'other';
  sourceAccountId: string;
  targetAccountId: string;
  previousDelegate: string | null;
  newDelegate: string | null;
  chainId?: number;
};

export type DaoResponseItem = z.infer<typeof DaoSchema>;
export type VoteItem = z.infer<typeof VoteItemSchema>;
export type ProposalNonVoterItem = z.infer<typeof ProposalNonVoterSchema>;
export type OffchainProposalResponseItem = z.infer<typeof OffchainProposalItemSchema>;
export type OffchainVoteResponseItem = z.infer<typeof OffchainVoteItemSchema>;

export function normalizeDao(dao: DaoResponseItem): Dao {
  return {
    ...dao,
    id: toLegacyDaoId(dao.id),
  };
}

export function normalizeProposal(proposal: z.infer<typeof OnchainProposalSchema>): OnchainProposal {
  return {
    ...proposal,
    daoId: toLegacyDaoId(proposal.daoId),
  };
}

export function normalizeVote(vote: VoteItem): OnchainVote {
  return vote;
}

export function normalizeNonVoter(voter: ProposalNonVoterItem): ProposalNonVoter {
  return voter;
}

export function normalizeOffchainProposal(proposal: OffchainProposalResponseItem): OffchainProposalItem {
  return proposal;
}

export function normalizeOffchainVote(vote: OffchainVoteResponseItem): OffchainVoteItem {
  return vote;
}

export function processVotingPowerHistory(
  items: HistoricalVotingPower[],
  daoId: string,
  chainId?: number
): ProcessedVotingPowerHistory[] {
  return items
    .filter(item => item.accountId)
    .map(item => ({
      ...item,
      daoId: toLegacyDaoId(daoId),
      changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
      sourceAccountId: item.transfer?.from || item.delegation?.from || '',
      targetAccountId: item.accountId,
      previousDelegate: item.delegation?.previousDelegate || null,
      newDelegate: item.delegation?.to || null,
      chainId,
    }));
}
