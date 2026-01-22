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
  ListHistoricalVotingPowerQuery,
  ListHistoricalVotingPowerQueryVariables
} from './gql/graphql';

// Export GraphQL enums
export {
  QueryInput_Proposals_OrderDirection,
  QueryInput_HistoricalVotingPower_OrderBy,
  QueryInput_HistoricalVotingPower_OrderDirection
} from './gql/graphql';

export type { ProcessedVotingPowerHistory } from './schemas';