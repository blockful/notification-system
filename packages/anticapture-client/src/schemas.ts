import { z } from 'zod';

export {
  FeedEventType,
  FeedRelevance,
} from './gql/graphql';

// Schema with built-in transformation and fallbacks
export const SafeDaosResponseSchema = z.object({
  daos: z.object({
    items: z.array(z.object({
      id: z.string(),
      votingDelay: z.string().optional(),
      chainId: z.number(),
      alreadySupportCalldataReview: z.boolean().optional(),
      supportOffchainData: z.boolean().optional()
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
  logIndex: z.number(),
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
      support: z.string().nullable().optional(),
      votingPower: z.string(),
      timestamp: z.number(),
      reason: z.string().nullable().optional(),
      proposalTitle: z.string().nullable().optional(),
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

export const SafeOffchainProposalNonVotersResponseSchema = z.object({
  offchainProposalNonVoters: z.object({
    items: z.array(z.object({
      voter: z.string(),
      votingPower: z.string().optional()
    }).nullable()),
    totalCount: z.number().optional()
  }).nullable()
}).transform((data) => {
  if (!data.offchainProposalNonVoters) {
    console.warn('OffchainProposalNonVotersResponse has null offchainProposalNonVoters:', data);
    return { offchainProposalNonVoters: { items: [], totalCount: 0 } };
  }
  return {
    offchainProposalNonVoters: {
      ...data.offchainProposalNonVoters,
      items: data.offchainProposalNonVoters.items.filter((item): item is { voter: string; votingPower?: string } => item !== null)
    }
  };
});

export const EventThresholdResponseSchema = z.object({
  getEventRelevanceThreshold: z.object({
    threshold: z.string()
  })
});

export const OffchainProposalItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  discussion: z.string(),
  link: z.string(),
  state: z.string(),
  created: z.number(),
  end: z.number(),
  start: z.number().optional(),
});

export type OffchainProposalItem = z.infer<typeof OffchainProposalItemSchema>;

export const SafeOffchainProposalsResponseSchema = z.object({
  offchainProposals: z.object({
    items: z.array(OffchainProposalItemSchema.nullable()),
    totalCount: z.number(),
  }).nullable(),
}).transform((data) => {
  if (!data.offchainProposals) {
    console.warn('OffchainProposalsResponse has null offchainProposals:', data);
    return { offchainProposals: { items: [], totalCount: 0 } };
  }
  return {
    offchainProposals: {
      ...data.offchainProposals,
      items: data.offchainProposals.items.filter(
        (item): item is OffchainProposalItem => item !== null
      ),
    },
  };
});

export const OffchainVoteItemSchema = z.object({
  voter: z.string(),
  created: z.number(),
  proposalId: z.string(),
  proposalTitle: z.string(),
  reason: z.string().nullable().optional(),
  vp: z.number().nullable().optional(),
});

export type OffchainVoteItem = z.infer<typeof OffchainVoteItemSchema>;

export const SafeOffchainVotesResponseSchema = z.object({
  votesOffchain: z.object({
    items: z.array(OffchainVoteItemSchema.nullable()),
    totalCount: z.number(),
  }).nullable(),
}).transform((data) => {
  if (!data.votesOffchain) {
    console.warn('OffchainVotesResponse has null votesOffchain:', data);
    return { votesOffchain: { items: [], totalCount: 0 } };
  }
  return {
    votesOffchain: {
      ...data.votesOffchain,
      items: data.votesOffchain.items.filter(
        (item): item is OffchainVoteItem => item !== null
      ),
    },
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

