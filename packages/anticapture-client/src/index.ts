export { AnticaptureClient } from './anticapture-client';

// Export Vote types
export type { VoteWithDaoId } from './anticapture-client';

// Export GraphQL types for apps to use
export type {
  GetDaOsQuery,
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListVotesQuery,
  ListVotesQueryVariables,
  ListHistoricalVotingPowerQuery,
  ListHistoricalVotingPowerQueryVariables
} from './gql/graphql';

// Export GraphQL enums
export {
  QueryInput_Proposals_OrderDirection,
  QueryInput_HistoricalVotingPower_OrderBy,
  QueryInput_HistoricalVotingPower_OrderDirection,
  QueryInput_Votes_OrderBy,
  QueryInput_Votes_OrderDirection
} from './gql/graphql';

export type { ProcessedVotingPowerHistory, OffchainProposalItem } from './schemas';