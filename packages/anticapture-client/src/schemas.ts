import { z } from 'zod';

// Schema with built-in transformation and fallbacks
export const SafeDaosResponseSchema = z.object({
  daos: z.object({
    items: z.array(z.object({ id: z.string() }))
  }).nullable()
}).transform((data, ctx) => {
  if (!data.daos || !data.daos.items) {
    console.warn('DaosResponse has null daos or items:', data);
    return { daos: { items: [] } };
  }
  return { daos: { items: data.daos.items } };
}).catch(() => {
  console.warn('DaosResponse validation failed completely');
  return { daos: { items: [] } };
});


export const SafeProposalsResponseSchema = z.object({
  proposalsOnchains: z.object({
    items: z.array(z.any())
  }).nullable()
}).transform((data, ctx) => {
  if (!data.proposalsOnchains || !data.proposalsOnchains.items) {
    console.warn('ProposalsResponse has null proposalsOnchains or items:', data);
    return { proposalsOnchains: { items: [] } };
  }
  return { proposalsOnchains: { items: data.proposalsOnchains.items } };
}).catch(() => {
  console.warn('ProposalsResponse validation failed completely');
  return { proposalsOnchains: { items: [] } };
});

export const SafeProposalByIdResponseSchema = z.object({
  proposalsOnchain: z.any().nullable()
}).catch(() => {
  console.warn('ProposalByIdResponse validation failed completely');
  return { proposalsOnchain: null };
});

export const SafeVotingPowerHistoryResponseSchema = z.object({
  votingPowerHistorys: z.object({
    items: z.array(z.object({
      delta: z.number(),
      accountId: z.string(),
      daoId: z.string(),
      votingPower: z.number(),
      timestamp: z.string(),
      delegation: z.object({
        delegatedValue: z.number(),
        delegatorAccountId: z.string()
      }),
      transfer: z.object({
        amount: z.number(),
        fromAccountId: z.string(),
        toAccountId: z.string()
      }),
    }))
  }).nullable()
}).transform((data, ctx) => {
  if (!data.votingPowerHistorys || !data.votingPowerHistorys.items) {
    console.warn('VotingPowerHistoryResponse has null votingPowerHistorys or items:', data);
    return { votingPowerHistorys: { items: [] } };
  }
  return { votingPowerHistorys: { items: data.votingPowerHistorys.items } };
}).catch(() => {
  console.warn('VotingPowerHistoryResponse validation failed completely');
  return { votingPowerHistorys: { items: [] } };
});



// Export inferred types for use in the client
export type SafeDaosResponse = z.infer<typeof SafeDaosResponseSchema>;
export type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
export type SafeProposalByIdResponse = z.infer<typeof SafeProposalByIdResponseSchema>;
export type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;

// Helper function to process validated proposals
export function processProposals(validated: SafeProposalsResponse, daoId: string) {
  return validated.proposalsOnchains.items.reduce((acc, proposal) => {
    if (proposal !== null) {
      acc.push({
        ...proposal,
        daoId: daoId
      });
    }
    return acc;
  }, [] as typeof validated.proposalsOnchains.items);
}

// Helper function to process validated voting power history
export function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string) {
  return validated.votingPowerHistorys.items.reduce((acc, votingPowerHistory) => {
    if (votingPowerHistory !== null) {
      acc.push({
        ...votingPowerHistory,
        daoId: daoId,
        delta: votingPowerHistory.delta || 0
      });
    }
    return acc;
  }, [] as typeof validated.votingPowerHistorys.items);
}

