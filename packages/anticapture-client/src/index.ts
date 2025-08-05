export { AnticaptureClient } from './anticapture-client';

// Export GraphQL types for apps to use
export type {
  GetDaOsQuery,
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  VotingPowerHistory,
  VotingPowerHistoryFilter,
  ListVotingPowerHistorysQuery,
  ListVotingPowerHistorysQueryVariables
} from '../dist/gql/graphql';

export type { ProcessedVotingPowerHistory } from './schemas';