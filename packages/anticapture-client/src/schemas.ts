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

export function validateDaosResponse(data: unknown) {
  return SafeDaosResponseSchema.parse(data);
}

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

export function validateProposalsResponse(data: unknown) {
  return SafeProposalsResponseSchema.parse(data);
}

export function validateProposalByIdResponse(data: unknown) {
  return SafeProposalByIdResponseSchema.parse(data);
}

// Export inferred types for use in the client
export type SafeDaosResponse = z.infer<typeof SafeDaosResponseSchema>;
export type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
export type SafeProposalByIdResponse = z.infer<typeof SafeProposalByIdResponseSchema>;

// Utility function that validates AND processes proposals in one go
export function validateAndProcessProposals(data: unknown, daoId: string) {
  const validated = validateProposalsResponse(data);
  
  // Process the items directly here, eliminating the need for a separate method
  const processedItems = validated.proposalsOnchains.items.reduce((acc, proposal) => {
    if (proposal !== null) {
      acc.push({
        ...proposal,
        daoId: proposal.daoId || daoId
      });
    }
    return acc;
  }, [] as typeof validated.proposalsOnchains.items);
  
  return processedItems;
}