export { AnticaptureClient } from './anticapture-client';

// Export Vote types
export type { VoteWithDaoId, OffchainVoteWithDaoId } from './anticapture-client';

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
  OrderDirection,
  QueryInput_HistoricalVotingPower_OrderBy,
  QueryInput_Proposals_Status_Items,
  QueryInput_Votes_OrderBy,
  QueryInput_VotesOffchain_OrderBy,
} from './gql/graphql';

export { FeedEventType, FeedRelevance } from './schemas';
export type { ProcessedVotingPowerHistory, OffchainProposalItem, OffchainVoteItem } from './schemas';
