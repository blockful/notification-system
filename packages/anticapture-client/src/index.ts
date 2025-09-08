export { AnticaptureClient } from './anticapture-client';

// Export GraphQL types for apps to use
export type {
  GetDaOsQuery,
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListVotesOnchainsQuery,
  ListVotesOnchainsQueryVariables,
  VotesOnchain,
  VotingPowerHistory,
  VotingPowerHistoryFilter,
  ListVotingPowerHistorysQuery,
  ListVotingPowerHistorysQueryVariables
} from './gql/graphql';

// Export GraphQL enums
export {
  QueryInput_Proposals_OrderDirection
} from './gql/graphql';

export type { ProcessedVotingPowerHistory } from './schemas';