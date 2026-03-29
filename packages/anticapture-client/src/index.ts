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
  ListHistoricalVotingPowerQueryVariables,
  OnchainProposal
} from './gql/graphql';

// Export GraphQL enums
export {
  OrderDirection,
  OrderDirection as QueryInput_Proposals_OrderDirection,
  QueryInput_HistoricalVotingPower_OrderBy,
  OrderDirection as QueryInput_HistoricalVotingPower_OrderDirection,
  QueryInput_Votes_OrderBy,
  OrderDirection as QueryInput_Votes_OrderDirection,
  QueryInput_VotesOffchain_OrderBy,
  OrderDirection as QueryInput_VotesOffchain_OrderDirection
} from './gql/graphql';

export { FeedEventType, FeedRelevance } from './schemas';
export type { ProcessedVotingPowerHistory, OffchainProposalItem, OffchainVoteItem } from './schemas';
