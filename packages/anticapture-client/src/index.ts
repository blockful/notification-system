export { AnticaptureClient } from './anticapture-client';
export type { AnticaptureClientConfig, VoteWithDaoId, OffchainVoteWithDaoId, DaoInfo, IAnticaptureClient } from './anticapture-client';

export { makeAnticaptureClient, noopAnticaptureClient } from './test-doubles';

export type { ProcessedVotingPowerHistory, OffchainProposalItem, OffchainVoteItem } from './types';

export {
  orderDirectionEnum,
  feedEventTypeEnum,
  feedRelevanceEnum,
  onchainProposalStatusListEnum,
  offchainProposalStatusListEnum,
  historicalVotingPowerQueryParamsOrderByEnum,
} from '@anticapture/client';

export type {
  OrderDirection,
  FeedEventType,
  FeedRelevance,
  OnchainProposalStatusListEnumKey,
  OffchainProposalStatusListEnumKey,
  HistoricalVotingPowerQueryParamsOrderByEnumKey,
  ProposalsQueryParams,
  HistoricalVotingPowerQueryParams,
  OnchainProposal,
  OnchainVote,
  OffchainProposal,
  OffchainVote,
  Voter,
  OffchainNonVoter,
  HistoricalVotingPower,
} from '@anticapture/client';
