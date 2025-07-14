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
}).transform((data, ctx) => {
  if (!data.votingPowerHistorys || !data.votingPowerHistorys.items) {
    console.warn('VotingPowerHistoryResponse has null votingPowerHistorys or items:', data);
    return { votingPowerHistorys: { items: [] } };
  }
  
  // Filter out null items (items that failed validation in VotingPowerHistoryItemSchema)
  const validItems = data.votingPowerHistorys.items.filter(item => item !== null);
  const invalidCount = data.votingPowerHistorys.items.length - validItems.length;
  
  if (invalidCount > 0) {
    console.warn(`VotingPowerHistoryResponse: Filtered out ${invalidCount} invalid item(s) due to missing required fields (timestamp, votingPower, daoId, or transactionHash)`);
  }
  
  return { votingPowerHistorys: { items: validItems } };
}).catch((error) => {
  console.warn('VotingPowerHistoryResponse validation failed completely');
  console.warn('Error details:', error);
  console.warn('Input data received:', JSON.stringify(error.input, null, 2));
  return { votingPowerHistorys: { items: [] } };
});



// Internal types for schema validation
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;

// Type for processed voting power history with calculated fields (based on actual API)
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
  changeType: 'delegation' | 'transfer' | 'other';
  sourceAccountId: string;
  targetAccountId: string;
};

// Internal helper function to process validated proposals
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

// Internal helper function to process validated voting power history
export function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string): ProcessedVotingPowerHistory[] {
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
        targetAccountId: item.accountId
      };
      
      return processed;
    });
}

