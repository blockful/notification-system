import { IAnticaptureClient } from './anticapture-client';

export const noopAnticaptureClient: IAnticaptureClient = {
  getDAOs: async () => [],
  getProposalById: async () => null,
  listProposals: async () => [],
  listVotingPowerHistory: async () => [],
  listVotes: async () => [],
  getProposalNonVoters: async () => [],
  getOffchainProposalNonVoters: async () => [],
  listRecentVotesFromAllDaos: async () => [],
  getEventThreshold: async () => null,
  listOffchainProposals: async () => [],
  listOffchainVotes: async () => [],
  listRecentOffchainVotesFromAllDaos: async () => [],
};

export function makeAnticaptureClient(
  overrides: Partial<IAnticaptureClient> = {},
): IAnticaptureClient {
  return { ...noopAnticaptureClient, ...overrides };
}
