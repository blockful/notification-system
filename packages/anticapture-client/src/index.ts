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
} from './gql/graphql';

// Export processed types with helper methods
export type { ProcessedVotingPowerHistory } from './schemas';