import { z } from 'zod';

// Schema with built-in transformation and fallbacks
export const SafeDaosResponseSchema = z.object({
  daos: z.object({
    items: z.array(z.object({
      id: z.string(),
      votingDelay: z.string().optional(),
      chainId: z.number()
    }))
  }).nullable()
}).transform((data) => {
  if (!data.daos || !data.daos.items) {
    console.warn('DaosResponse has null daos or items:', data);
    return { daos: { items: [] } };
  }
  return { daos: { items: data.daos.items } };
});


export const SafeProposalsResponseSchema = z.object({
  proposals: z.object({
    items: z.array(z.any()),
    totalCount: z.number()
  }).nullable()
}).transform((data) => {
  if (!data.proposals) {
    console.warn('ProposalsResponse has null proposals:', data);
    return { proposals: { items: [], totalCount: 0 } };
  }
  return { proposals: data.proposals };
});

export const SafeProposalByIdResponseSchema = z.object({
  proposal: z.any().nullable()
});

// Define schema for voting power history item (based on actual API response)
// Handle real-world scenarios where API might return null values or missing fields
const VotingPowerHistoryItemSchema = z.object({
  accountId: z.string(),
  timestamp: z.string(),
  votingPower: z.string().nullable(),
  delta: z.string().nullable(),
  daoId: z.string().nullable().default(null),
  transactionHash: z.string(),
  delegation: z.object({
    delegatorAccountId: z.string(),
    delegatedValue: z.string()
  }).nullable().default(null),
  transfer: z.object({
    amount: z.string().nullable(),
    fromAccountId: z.string(),
    toAccountId: z.string()
  }).nullable().default(null)
});

export const SafeVotingPowerHistoryResponseSchema = z.object({
  votingPowerHistorys: z.object({
    items: z.array(VotingPowerHistoryItemSchema)
  }).nullable()
}).transform((data) => {
  // Ensure we always have a valid structure
  return {
    votingPowerHistorys: data.votingPowerHistorys || { items: [] }
  };
});

export const SafeVotesOnchainsResponseSchema = z.object({
  votesOnchains: z.object({
    items: z.array(z.object({
      daoId: z.string(),
      txHash: z.string(),
      proposalId: z.string(),
      voterAccountId: z.string(),
      support: z.string(),
      votingPower: z.string(),
      timestamp: z.string(),
      reason: z.string().optional().nullable()
    })),
    totalCount: z.number()
  })
});



// Internal types for schema validation
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;

// Type for processed voting power history with calculated fields (based on actual API)
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
  changeType: 'delegation' | 'transfer' | 'other';
  sourceAccountId: string;
  targetAccountId: string;
  chainId?: number;
};

// Internal helper function to process validated proposals
export function processProposals(validated: SafeProposalsResponse, daoId: string) {
  return validated.proposals.items.reduce((acc, proposal) => {
    if (proposal !== null) {
      acc.push({
        ...proposal,
        daoId: daoId
      });
    }
    return acc;
  }, [] as typeof validated.proposals.items);
}

// Internal helper function to process validated voting power history
export function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string, chainId?: number): ProcessedVotingPowerHistory[] {
  return validated.votingPowerHistorys.items
    .filter(item => item.accountId)
    .map((item) => {
      const processed: ProcessedVotingPowerHistory = {
        ...item,
        accountId: item.accountId,
        daoId: daoId,
        delta: item.delta,
        changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
        sourceAccountId: item.transfer?.fromAccountId || item.delegation?.delegatorAccountId || '',
        targetAccountId: item.accountId,
        ...(chainId !== undefined && { chainId })
      };

      return processed;
    });
}

