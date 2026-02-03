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

// Define schema for historical voting power item
const HistoricalVotingPowerItemSchema = z.object({
  accountId: z.string(),
  timestamp: z.string(),
  votingPower: z.string(),
  delta: z.string(),
  daoId: z.string(),
  transactionHash: z.string(),
  delegation: z.object({
    from: z.string(),
    to: z.string(),
    value: z.string(),
    previousDelegate: z.string().nullable()
  }).nullable(),
  transfer: z.object({
    from: z.string(),
    to: z.string(),
    value: z.string()
  }).nullable()
});

export const SafeHistoricalVotingPowerResponseSchema = z.object({
  historicalVotingPower: z.object({
    items: z.array(HistoricalVotingPowerItemSchema.nullable()),
    totalCount: z.number()
  }).nullable()
}).transform((data) => {
  // Ensure we always have a valid structure
  const items = data.historicalVotingPower?.items?.filter((item)=> item !== null) || [];
  return {
    historicalVotingPower: {
      items,
      totalCount: data.historicalVotingPower?.totalCount || 0
    }
  };
});

export const SafeVotesResponseSchema = z.object({
  votes: z.object({
    items: z.array(z.object({
      transactionHash: z.string(),
      proposalId: z.string(),
      voterAddress: z.string(),
      support: z.number(),
      votingPower: z.string(),
      timestamp: z.number(),
      reason: z.string().nullable().optional(),
      proposalTitle: z.string(),
    }).nullable()),
    totalCount: z.number(),
  }).nullable(),
}).transform((data) => {
  if (!data.votes) {
    console.warn('VotesResponse has no votes:', data);
    return { votes: { items: [], totalCount: 0 } };
  }
  return {
    votes: {
      ...data.votes,
      items: data.votes.items.filter((item): item is NonNullable<typeof item> => item !== null)
    }
  };
});

export const SafeProposalNonVotersResponseSchema = z.object({
  proposalNonVoters: z.object({
    items: z.array(z.object({
      voter: z.string()
    }).nullable()),
    totalCount: z.number().optional()
  }).nullable()
}).transform((data) => {
  if (!data.proposalNonVoters) {
    console.warn('ProposalNonVotersResponse has null proposalNonVoters:', data);
    return { proposalNonVoters: { items: [], totalCount: 0 } };
  }
  return {
    proposalNonVoters: {
      ...data.proposalNonVoters,
      items: data.proposalNonVoters.items.filter((item): item is { voter: string } => item !== null)
    }
  };
});


// Internal types for schema validation
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeHistoricalVotingPowerResponse = z.infer<typeof SafeHistoricalVotingPowerResponseSchema>;
type ProposalNonVoter = NonNullable<z.infer<typeof SafeProposalNonVotersResponseSchema>['proposalNonVoters']['items'][0]>;

// Type for processed voting power history with calculated fields (based on new API)
export type ProcessedVotingPowerHistory = z.infer<typeof HistoricalVotingPowerItemSchema> & {
  changeType: 'delegation' | 'transfer' | 'other';
  sourceAccountId: string;
  targetAccountId: string;
  previousDelegate: string | null;
  newDelegate: string | null;
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
export function processVotingPowerHistory(validated: SafeHistoricalVotingPowerResponse, daoId: string, chainId?: number): ProcessedVotingPowerHistory[] {
  return validated.historicalVotingPower.items
    .filter(item => item.accountId)
    .map((item) => {
      const processed: ProcessedVotingPowerHistory = {
        ...item,
        accountId: item.accountId,
        daoId: daoId,
        delta: item.delta,
        changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
        sourceAccountId: item.transfer?.from || item.delegation?.from || '',
        targetAccountId: item.accountId,
        previousDelegate: item.delegation?.previousDelegate || null,
        newDelegate: item.delegation?.to || null,
        ...(chainId !== undefined && { chainId })
      };

      return processed;
    });
}

