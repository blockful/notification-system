/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  ObjMap: { input: any; output: any; }
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: { input: any; output: any; }
};

/** Balance delta for a single account across two timestamps. */
export type AccountBalanceVariation = {
  __typename?: 'AccountBalanceVariation';
  /** Absolute balance change encoded as a decimal string. */
  absoluteChange: Scalars['String']['output'];
  /** Account address. */
  accountId: Scalars['String']['output'];
  /** Balance at the end of the comparison window. */
  currentBalance: Scalars['String']['output'];
  /** Relative balance change encoded as a decimal string. */
  percentageChange: Scalars['String']['output'];
  /** Balance at the start of the comparison window. */
  previousBalance: Scalars['String']['output'];
};

/** Balance variation response for a single account. */
export type AccountBalanceVariationsByAccountIdResponse = {
  __typename?: 'AccountBalanceVariationsByAccountIdResponse';
  data: AccountBalanceVariation;
  period: PeriodResponse;
};

/** List of balance variations for multiple accounts in the selected period. */
export type AccountBalanceVariationsResponse = {
  __typename?: 'AccountBalanceVariationsResponse';
  items: Array<Maybe<AccountBalanceVariation>>;
  period: PeriodResponse;
};

export type AccountBalanceWithVariation = {
  __typename?: 'AccountBalanceWithVariation';
  address: Scalars['String']['output'];
  balance: Scalars['String']['output'];
  delegate: Scalars['String']['output'];
  tokenId: Scalars['String']['output'];
  variation: AccountBalanceVariation;
};

export type AccountBalanceWithVariationResponse = {
  __typename?: 'AccountBalanceWithVariationResponse';
  data: AccountBalanceWithVariation;
  period: PeriodResponse;
};

export type AccountBalancesWithVariationResponse = {
  __typename?: 'AccountBalancesWithVariationResponse';
  items: Array<Maybe<AccountBalanceWithVariation>>;
  period: PeriodResponse;
  totalCount: Scalars['Int']['output'];
};

/** Aggregated interaction metrics between the requested account and another account. */
export type AccountInteraction = {
  __typename?: 'AccountInteraction';
  /** Counterparty account ID. */
  accountId: Scalars['String']['output'];
  /** Net amount transferred between the requested account and the counterparty. */
  amountTransferred: Scalars['String']['output'];
  /** Gross transfer volume between the requested account and the counterparty. */
  totalVolume: Scalars['String']['output'];
  /** Number of transfers observed for the interaction pair. */
  transferCount: Scalars['String']['output'];
};

/** Paginated list of account interaction aggregates. */
export type AccountInteractionsResponse = {
  __typename?: 'AccountInteractionsResponse';
  items: Array<Maybe<AccountInteraction>>;
  period: PeriodResponse;
  totalCount: Scalars['Int']['output'];
};

/** Active token supply for the selected comparison window. */
export type ActiveSupplyResponse = {
  __typename?: 'ActiveSupplyResponse';
  /** Active token supply encoded as a decimal string. */
  activeSupply: Scalars['String']['output'];
};

export type AverageDelegationPercentageItem = {
  __typename?: 'AverageDelegationPercentageItem';
  date: Scalars['String']['output'];
  high: Scalars['String']['output'];
};

export type AverageDelegationPercentagePage = {
  __typename?: 'AverageDelegationPercentagePage';
  items: Array<AverageDelegationPercentageItem>;
  pageInfo: PageInfo;
  /**
   * The actual number of items returned in this response.
   * May be less than requested if DAOs don't have overlapping data for the full date range.
   */
  totalCount: Scalars['Int']['output'];
};

/** Average turnout comparison between two adjacent time windows. */
export type AverageTurnoutComparisonResponse = {
  __typename?: 'AverageTurnoutComparisonResponse';
  /** Relative change between current and previous periods. */
  changeRate: Scalars['Float']['output'];
  /** Average turnout for the current period encoded as a string. */
  currentAverageTurnout: Scalars['String']['output'];
  /** Average turnout for the previous period encoded as a string. */
  oldAverageTurnout: Scalars['String']['output'];
};

export type DaoList = {
  __typename?: 'DAOList';
  items: Array<DaoResponse>;
  totalCount: Scalars['Int']['output'];
};

/** Current governance parameters and feature flags for the active DAO. */
export type DaoResponse = {
  __typename?: 'DaoResponse';
  alreadySupportCalldataReview: Scalars['Boolean']['output'];
  chainId: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  proposalThreshold: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  supportOffchainData: Scalars['Boolean']['output'];
  timelockDelay: Scalars['String']['output'];
  votingDelay: Scalars['String']['output'];
  votingPeriod: Scalars['String']['output'];
};

export enum DaysWindow {
  '7d' = '_7d',
  '30d' = '_30d',
  '90d' = '_90d',
  '180d' = '_180d',
  '365d' = '_365d'
}

/** Single delegation transfer event in the historical delegation feed. */
export type DelegationItem = {
  __typename?: 'DelegationItem';
  amount: Scalars['String']['output'];
  delegateAddress: Scalars['String']['output'];
  delegatorAddress: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
};

export type DelegationPercentageItem = {
  __typename?: 'DelegationPercentageItem';
  /** Unix day bucket represented as a timestamp string. */
  date: Scalars['String']['output'];
  /** Delegation percentage value for the day bucket. */
  high: Scalars['String']['output'];
};

export type DelegationPercentageResponse = {
  __typename?: 'DelegationPercentageResponse';
  items: Array<Maybe<DelegationPercentageItem>>;
  pageInfo: PageInfo;
  /** Total number of matching day buckets. */
  totalCount: Scalars['Int']['output'];
};

/** Paginated historical delegations response. */
export type DelegationsResponse = {
  __typename?: 'DelegationsResponse';
  items: Array<Maybe<DelegationItem>>;
  totalCount: Scalars['Int']['output'];
};

/** Aggregated delegation amount and latest timestamp for one delegator. */
export type DelegatorItem = {
  __typename?: 'DelegatorItem';
  amount: Scalars['String']['output'];
  delegatorAddress: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

/** Paginated delegators for a delegate address. */
export type DelegatorsResponse = {
  __typename?: 'DelegatorsResponse';
  items: Array<Maybe<DelegatorItem>>;
  totalCount: Scalars['Int']['output'];
};

/** Generic error payload returned by the API. */
export type ErrorResponse = {
  __typename?: 'ErrorResponse';
  /** Human-readable error message */
  error: Scalars['String']['output'];
  /** Optional implementation detail or validation context for the error. */
  message?: Maybe<Scalars['String']['output']>;
};

/** Resolved threshold for a feed event type and relevance level. */
export type EventRelevanceThresholdResponse = {
  __typename?: 'EventRelevanceThresholdResponse';
  /** Threshold value encoded as a decimal string. */
  threshold: Scalars['String']['output'];
};

/** Filter events by governance activity type. */
export enum FeedEventType {
  Delegation = 'DELEGATION',
  Proposal = 'PROPOSAL',
  ProposalExtended = 'PROPOSAL_EXTENDED',
  Transfer = 'TRANSFER',
  Vote = 'VOTE'
}

/** Single event in the governance activity feed. */
export type FeedItem = {
  __typename?: 'FeedItem';
  /** Log index within the transaction receipt. */
  logIndex: Scalars['Int']['output'];
  /** Type-specific metadata for the feed event. */
  metadata?: Maybe<Scalars['JSON']['output']>;
  relevance: FeedRelevance;
  /** Event timestamp in Unix seconds. */
  timestamp: Scalars['Int']['output'];
  /** Transaction hash. */
  txHash: Scalars['String']['output'];
  type: FeedEventType;
  /** Optional event value encoded as a decimal string when applicable. */
  value?: Maybe<Scalars['String']['output']>;
};

/** Filter events by relevance tier. */
export enum FeedRelevance {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

/** Paginated governance activity feed response. */
export type FeedResponse = {
  __typename?: 'FeedResponse';
  items: Array<Maybe<FeedItem>>;
  /** Total number of matching feed events. */
  totalCount: Scalars['Int']['output'];
};

export enum HttpMethod {
  Connect = 'CONNECT',
  Delete = 'DELETE',
  Get = 'GET',
  Head = 'HEAD',
  Options = 'OPTIONS',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT',
  Trace = 'TRACE'
}

/** Single historical balance record enriched with transfer context. */
export type HistoricalBalance = {
  __typename?: 'HistoricalBalance';
  /** Account address. */
  accountId: Scalars['String']['output'];
  /** Account balance after the historical event. */
  balance: Scalars['String']['output'];
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  /** Balance change introduced by the historical event. */
  delta: Scalars['String']['output'];
  /** Log index within the transaction receipt. */
  logIndex: Scalars['Int']['output'];
  /** Event timestamp in Unix seconds as a string. */
  timestamp: Scalars['String']['output'];
  /** Transaction hash. */
  transactionHash: Scalars['String']['output'];
  transfer: HistoricalBalanceTransfer;
};

/** Transfer event associated with a historical balance row. */
export type HistoricalBalanceTransfer = {
  __typename?: 'HistoricalBalanceTransfer';
  /** Sender address. */
  from: Scalars['String']['output'];
  /** Recipient address. */
  to: Scalars['String']['output'];
  /** Transferred amount encoded as a decimal string. */
  value: Scalars['String']['output'];
};

/** Paginated historical balance records for one account. */
export type HistoricalBalancesResponse = {
  __typename?: 'HistoricalBalancesResponse';
  items: Array<Maybe<HistoricalBalance>>;
  /** Total number of matching historical balance rows. */
  totalCount: Scalars['Int']['output'];
};

/** Single historical voting power record enriched with delegation and transfer context. */
export type HistoricalVotingPower = {
  __typename?: 'HistoricalVotingPower';
  /** Account address. */
  accountId: Scalars['String']['output'];
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  delegation?: Maybe<HistoricalVotingPowerDelegation>;
  /** Voting power change introduced by the event. */
  delta: Scalars['String']['output'];
  /** Log index within the transaction receipt. */
  logIndex: Scalars['Int']['output'];
  /** Event timestamp in Unix seconds as a string. */
  timestamp: Scalars['String']['output'];
  /** Transaction hash. */
  transactionHash: Scalars['String']['output'];
  transfer?: Maybe<HistoricalVotingPowerTransfer>;
  /** Voting power after the event, encoded as a decimal string. */
  votingPower: Scalars['String']['output'];
};

/** Delegation event associated with a historical voting power row. */
export type HistoricalVotingPowerDelegation = {
  __typename?: 'HistoricalVotingPowerDelegation';
  from: Scalars['String']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** Transfer event associated with a historical voting power row. */
export type HistoricalVotingPowerTransfer = {
  __typename?: 'HistoricalVotingPowerTransfer';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

/** Paginated historical voting power records. */
export type HistoricalVotingPowersResponse = {
  __typename?: 'HistoricalVotingPowersResponse';
  items: Array<Maybe<HistoricalVotingPower>>;
  /** Total number of matching historical voting power rows. */
  totalCount: Scalars['Int']['output'];
};

/** Response payload describing the latest update time for a chart. */
export type LastUpdateResponse = {
  __typename?: 'LastUpdateResponse';
  /** Latest refresh time in ISO-8601 format. */
  lastUpdate: Scalars['DateTime']['output'];
};

export type OffchainProposal = {
  __typename?: 'OffchainProposal';
  /** Address or ENS of the author. */
  author: Scalars['String']['output'];
  /** Proposal body. */
  body: Scalars['String']['output'];
  choices: Array<Maybe<Scalars['String']['output']>>;
  /** Creation timestamp in Unix seconds. */
  created: Scalars['Int']['output'];
  /** Discussion URL or thread reference. */
  discussion: Scalars['String']['output'];
  /** Voting end timestamp in Unix seconds. */
  end: Scalars['Int']['output'];
  /** Whether the proposal was flagged by Snapshot. */
  flagged: Scalars['Boolean']['output'];
  /** Snapshot proposal identifier. */
  id: Scalars['String']['output'];
  /** Canonical Snapshot proposal URL. */
  link: Scalars['String']['output'];
  network: Scalars['String']['output'];
  scores: Array<Maybe<Scalars['Float']['output']>>;
  snapshot?: Maybe<Scalars['Float']['output']>;
  /** Snapshot space identifier. */
  spaceId: Scalars['String']['output'];
  /** Voting start timestamp in Unix seconds. */
  start: Scalars['Int']['output'];
  /** Current Snapshot proposal state. */
  state: Scalars['String']['output'];
  strategies: Array<Maybe<Query_OffchainProposals_Items_Items_Strategies_Items>>;
  /** Proposal title. */
  title: Scalars['String']['output'];
  /** Snapshot proposal type. */
  type: Scalars['String']['output'];
  /** Last update timestamp in Unix seconds. */
  updated: Scalars['Int']['output'];
};

export type OffchainProposalsResponse = {
  __typename?: 'OffchainProposalsResponse';
  items: Array<Maybe<OffchainProposal>>;
  totalCount: Scalars['Int']['output'];
};

export type OffchainVote = {
  __typename?: 'OffchainVote';
  choice: Scalars['JSON']['output'];
  created: Scalars['Int']['output'];
  proposalId: Scalars['String']['output'];
  proposalTitle?: Maybe<Scalars['String']['output']>;
  reason: Scalars['String']['output'];
  voter: Scalars['String']['output'];
  vp?: Maybe<Scalars['Float']['output']>;
};

export type OffchainVotesResponse = {
  __typename?: 'OffchainVotesResponse';
  items: Array<Maybe<OffchainVote>>;
  totalCount: Scalars['Int']['output'];
};

export type OnchainProposal = {
  __typename?: 'OnchainProposal';
  /** Abstain votes, encoded as a decimal string. */
  abstainVotes: Scalars['String']['output'];
  /** Votes cast against, encoded as a decimal string. */
  againstVotes: Scalars['String']['output'];
  /** Encoded calldata payloads executed by the proposal. */
  calldatas: Array<Maybe<Scalars['String']['output']>>;
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  /** Proposal body. */
  description: Scalars['String']['output'];
  /** End block number. */
  endBlock: Scalars['Int']['output'];
  /** Proposal end timestamp in Unix seconds. */
  endTimestamp: Scalars['Int']['output'];
  /** Votes cast in favor, encoded as a decimal string. */
  forVotes: Scalars['String']['output'];
  /** Onchain proposal identifier. */
  id: Scalars['String']['output'];
  /** Optional proposal type discriminator. */
  proposalType?: Maybe<Scalars['Int']['output']>;
  /** Address that created the proposal. */
  proposerAccountId: Scalars['String']['output'];
  /** Required quorum encoded as a decimal string. */
  quorum: Scalars['String']['output'];
  /** Start block number. */
  startBlock: Scalars['Int']['output'];
  /** Proposal start timestamp in Unix seconds. */
  startTimestamp: Scalars['Int']['output'];
  /** Current proposal status. */
  status: Scalars['String']['output'];
  /** Contract targets invoked by the proposal. */
  targets: Array<Maybe<Scalars['String']['output']>>;
  /** Proposal creation timestamp in Unix seconds. */
  timestamp: Scalars['Int']['output'];
  /** Proposal title. */
  title: Scalars['String']['output'];
  /** Proposal creation transaction hash. */
  txHash: Scalars['String']['output'];
  /** ETH values attached to each call, encoded as strings. */
  values: Array<Maybe<Scalars['String']['output']>>;
};

export type OnchainProposalsResponse = {
  __typename?: 'OnchainProposalsResponse';
  items: Array<Maybe<OnchainProposal>>;
  totalCount: Scalars['Int']['output'];
};

export type OnchainVote = {
  __typename?: 'OnchainVote';
  proposalId: Scalars['String']['output'];
  proposalTitle?: Maybe<Scalars['String']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  /** Governance vote direction. */
  support?: Maybe<Scalars['String']['output']>;
  /** Vote timestamp in Unix seconds. */
  timestamp: Scalars['Int']['output'];
  transactionHash: Scalars['String']['output'];
  voterAddress: Scalars['String']['output'];
  /** Voting power encoded as a decimal string. */
  votingPower: Scalars['String']['output'];
};

export type OnchainVotesResponse = {
  __typename?: 'OnchainVotesResponse';
  items: Array<Maybe<OnchainVote>>;
  totalCount: Scalars['Int']['output'];
};

/** Sort direction for ordered query results. */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endDate?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
};

/** Inclusive time period represented as ISO-8601 timestamps. */
export type PeriodResponse = {
  __typename?: 'PeriodResponse';
  endTimestamp: Scalars['String']['output'];
  startTimestamp: Scalars['String']['output'];
};

/** Combined proposal and delegate vote context for one activity row. */
export type ProposalActivityItem = {
  __typename?: 'ProposalActivityItem';
  proposal: ProposalActivityProposal;
  userVote?: Maybe<ProposalActivityUserVote>;
};

/** Proposal snapshot included in the delegate activity response. */
export type ProposalActivityProposal = {
  __typename?: 'ProposalActivityProposal';
  /** Abstain votes, encoded as a decimal string. */
  abstainVotes: Scalars['String']['output'];
  /** Votes cast against, encoded as a decimal string. */
  againstVotes: Scalars['String']['output'];
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  /** Proposal body. */
  description: Scalars['String']['output'];
  /** End block number. */
  endBlock: Scalars['Float']['output'];
  /** Votes cast in favor, encoded as a decimal string. */
  forVotes: Scalars['String']['output'];
  /** Onchain proposal identifier. */
  id: Scalars['String']['output'];
  /** Address that created the proposal. */
  proposerAccountId: Scalars['String']['output'];
  /** Start block number. */
  startBlock: Scalars['Float']['output'];
  /** Current proposal status. */
  status: Scalars['String']['output'];
  /** Proposal creation timestamp in Unix seconds as a string. */
  timestamp?: Maybe<Scalars['String']['output']>;
  /** Proposal title. */
  title: Scalars['String']['output'];
};

/** Delegate proposal activity metrics and proposal-by-proposal history. */
export type ProposalActivityResponse = {
  __typename?: 'ProposalActivityResponse';
  /** Delegate address. */
  address: Scalars['String']['output'];
  /** Average seconds between the delegate vote and proposal end time. */
  avgTimeBeforeEnd: Scalars['Float']['output'];
  /** Whether the delegate never cast a vote. */
  neverVoted: Scalars['Boolean']['output'];
  proposals: Array<Maybe<ProposalActivityItem>>;
  /** Total proposals reviewed in the dataset. */
  totalProposals: Scalars['Int']['output'];
  /** Number of proposals the delegate voted on. */
  votedProposals: Scalars['Int']['output'];
  /** Share of proposals where the delegate sided with outcome. */
  winRate: Scalars['Float']['output'];
  /** Share of delegate votes cast in support. */
  yesRate: Scalars['Float']['output'];
};

/** Vote cast by the requested delegate for a given proposal. */
export type ProposalActivityUserVote = {
  __typename?: 'ProposalActivityUserVote';
  /** Vote identifier. */
  id: Scalars['String']['output'];
  /** Related proposal ID. */
  proposalId: Scalars['String']['output'];
  /** Optional vote rationale. */
  reason?: Maybe<Scalars['String']['output']>;
  /** Governance vote direction. */
  support: Scalars['String']['output'];
  /** Vote timestamp in Unix seconds as a string. */
  timestamp?: Maybe<Scalars['String']['output']>;
  /** Address that cast the vote. */
  voterAccountId: Scalars['String']['output'];
  /** Voting power used by the delegate, encoded as a string. */
  votingPower?: Maybe<Scalars['String']['output']>;
};

/** Proposal launch comparison between two adjacent time windows. */
export type ProposalsComparisonResponse = {
  __typename?: 'ProposalsComparisonResponse';
  /** Relative change between current and previous periods. */
  changeRate: Scalars['Float']['output'];
  /** Number of proposals launched in the current period. */
  currentProposalsLaunched: Scalars['Int']['output'];
  /** Number of proposals launched in the comparison period. */
  oldProposalsLaunched: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Returns account balance information for a specific address */
  accountBalanceByAccountId?: Maybe<AccountBalanceWithVariationResponse>;
  /** Returns a mapping of the biggest variations to account balances associated by account address */
  accountBalanceVariations?: Maybe<AccountBalanceVariationsResponse>;
  /** Returns a the changes to balance by period and accountId */
  accountBalanceVariationsByAccountId?: Maybe<AccountBalanceVariationsByAccountIdResponse>;
  /** Returns sorted and paginated account balance records */
  accountBalances?: Maybe<AccountBalancesWithVariationResponse>;
  /**
   * Returns a mapping of the largest interactions between accounts.
   * Positive amounts signify net token transfers FROM <address>, whilst negative amounts refer to net transfers TO <address>
   */
  accountInteractions?: Maybe<AccountInteractionsResponse>;
  /**
   * Average delegation percentage across all supported DAOs by day.
   * Returns the mean delegation percentage for each day in the specified range.
   * Only includes dates where ALL DAOs have data available.
   */
  averageDelegationPercentageByDay: AverageDelegationPercentagePage;
  /** Get active token supply for DAO */
  compareActiveSupply?: Maybe<ActiveSupplyResponse>;
  /** Compare average turnout between time periods */
  compareAverageTurnout?: Maybe<AverageTurnoutComparisonResponse>;
  /** Compare cex supply between periods */
  compareCexSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare circulating supply between periods */
  compareCirculatingSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare delegated supply between periods */
  compareDelegatedSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare dex supply between periods */
  compareDexSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare lending supply between periods */
  compareLendingSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare number of proposals between time periods */
  compareProposals?: Maybe<ProposalsComparisonResponse>;
  /** Compare total supply between periods */
  compareTotalSupply?: Maybe<SupplyComparisonResponse>;
  /** Compare treasury between periods */
  compareTreasury?: Maybe<SupplyComparisonResponse>;
  /** Compare number of votes between time periods */
  compareVotes?: Maybe<VotesComparisonResponse>;
  /** Returns current governance parameters for this DAO */
  dao?: Maybe<DaoResponse>;
  /** Get all DAOs */
  daos: DaoList;
  /** Get delegation percentage day buckets with forward-fill */
  delegationPercentageByDay?: Maybe<DelegationPercentageResponse>;
  /** Get current delegations for an account */
  delegations?: Maybe<DelegationsResponse>;
  /** Get current delegators of an account with voting power */
  delegators?: Maybe<DelegatorsResponse>;
  /** Get feed events */
  feedEvents?: Maybe<FeedResponse>;
  /** Returns label information from Arkham, ENS data, and whether the address is an EOA or contract. Arkham data is stored permanently. ENS data is cached with a configurable TTL. */
  getAddress?: Maybe<GetAddress_200_Response>;
  /** Returns label information from Arkham, ENS data, and address type for multiple addresses. Maximum 100 addresses per request. Arkham data is stored permanently. ENS data is cached with a configurable TTL. */
  getAddresses?: Maybe<GetAddresses_200_Response>;
  /** Get historical DAO Token Treasury value (governance token quantity × token price) */
  getDaoTokenTreasury?: Maybe<TreasuryResponse>;
  /** Get event relevance threshold */
  getEventRelevanceThreshold?: Maybe<EventRelevanceThresholdResponse>;
  /** Get historical Liquid Treasury (treasury without DAO tokens) from external providers (DefiLlama/Dune) */
  getLiquidTreasury?: Maybe<TreasuryResponse>;
  /** Get historical Total Treasury (liquid treasury + DAO token treasury) */
  getTotalTreasury?: Maybe<TreasuryResponse>;
  /** Returns historical balance deltas for one account, enriched with the transfer that caused each change. */
  historicalBalances?: Maybe<HistoricalBalancesResponse>;
  /** Get historical delegations for an account, with optional filtering and sorting */
  historicalDelegations?: Maybe<DelegationsResponse>;
  /** Get historical market data for a specific token */
  historicalTokenData?: Maybe<Array<Maybe<TokenHistoricalPriceItem>>>;
  /** Returns a list of voting power changes. */
  historicalVotingPower?: Maybe<HistoricalVotingPowersResponse>;
  /** Returns a list of voting power changes for a specific account */
  historicalVotingPowerByAccountId?: Maybe<HistoricalVotingPowersResponse>;
  /** Get the last update time */
  lastUpdate?: Maybe<LastUpdateResponse>;
  /** Returns a single offchain (Snapshot) proposal by its ID */
  offchainProposalById?: Maybe<OffchainProposalById_Response>;
  /** Returns the active delegates that did not vote on a given offchain proposal */
  offchainProposalNonVoters?: Maybe<OffchainProposalNonVoters_200_Response>;
  /** Returns a list of offchain (Snapshot) proposals */
  offchainProposals?: Maybe<OffchainProposalsResponse>;
  /** Returns a single proposal by its ID */
  proposal?: Maybe<Proposal_Response>;
  /** Returns the active delegates that did not vote on a given proposal */
  proposalNonVoters?: Maybe<VotersResponse>;
  /** Returns a list of proposal */
  proposals?: Maybe<OnchainProposalsResponse>;
  /** Returns proposal activity data including voting history, win rates, and detailed proposal information for the specified delegate within the given time window */
  proposalsActivity?: Maybe<ProposalActivityResponse>;
  /** Get property data for a specific token */
  token?: Maybe<Token_Response>;
  /** Returns token related metrics for a single metric type. */
  tokenMetrics?: Maybe<TokenMetricsResponse>;
  /** Get transactions with their associated transfers and delegations, with optional filtering and sorting */
  transactions?: Maybe<TransactionsResponse>;
  /** Get transfers of a given address */
  transfers?: Maybe<TransfersResponse>;
  /** Get all votes ordered by timestamp or voting power */
  votes?: Maybe<OnchainVotesResponse>;
  /** Returns a paginated list of votes cast on a specific proposal */
  votesByProposalId?: Maybe<OnchainVotesResponse>;
  /** Returns a list of offchain (Snapshot) votes */
  votesOffchain?: Maybe<OffchainVotesResponse>;
  /** Returns a paginated list of offchain (Snapshot) votes for a specific proposal */
  votesOffchainByProposalId?: Maybe<OffchainVotesResponse>;
  /** Returns voting power information for a specific address (account) */
  votingPowerByAccountId?: Maybe<VotingPower>;
  /** Returns a mapping of the voting power changes within a time frame for the given addresses */
  votingPowerVariations?: Maybe<VotingPowerVariationsResponse>;
  /** Returns a the changes to voting power by period and accountId */
  votingPowerVariationsByAccountId?: Maybe<VotingPowerVariationsByAccountIdResponse>;
  /** Returns sorted and paginated account voting power records */
  votingPowers?: Maybe<VotingPowersResponse>;
};


export type QueryAccountBalanceByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAccountBalanceVariationsArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAccountBalanceVariationsByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAccountBalancesArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  delegates?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  excludeDaoAddresses?: InputMaybe<Scalars['Boolean']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_AccountBalances_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAccountInteractionsArgs = {
  address: Scalars['String']['input'];
  filterAddress?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<QueryInput_AccountInteractions_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAverageDelegationPercentageByDayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['String']['input'];
};


export type QueryCompareActiveSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareAverageTurnoutArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareCexSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareCirculatingSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareDelegatedSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareDexSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareLendingSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareProposalsArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareTotalSupplyArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareTreasuryArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryCompareVotesArgs = {
  days?: InputMaybe<DaysWindow>;
};


export type QueryDelegationPercentageByDayArgs = {
  after?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['Int']['input']>;
  endDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  startDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDelegationsArgs = {
  address: Scalars['String']['input'];
};


export type QueryDelegatorsArgs = {
  address: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_Delegators_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFeedEventsArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_FeedEvents_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  relevance?: InputMaybe<QueryInput_FeedEvents_Relevance>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<QueryInput_FeedEvents_Type>;
};


export type QueryGetAddressArgs = {
  address: Scalars['String']['input'];
};


export type QueryGetAddressesArgs = {
  addresses: Array<InputMaybe<Scalars['String']['input']>>;
};


export type QueryGetDaoTokenTreasuryArgs = {
  days?: InputMaybe<DaysWindow>;
  orderDirection?: InputMaybe<OrderDirection>;
};


export type QueryGetEventRelevanceThresholdArgs = {
  relevance: FeedRelevance;
  type: FeedEventType;
};


export type QueryGetLiquidTreasuryArgs = {
  days?: InputMaybe<DaysWindow>;
  orderDirection?: InputMaybe<OrderDirection>;
};


export type QueryGetTotalTreasuryArgs = {
  days?: InputMaybe<DaysWindow>;
  orderDirection?: InputMaybe<OrderDirection>;
};


export type QueryHistoricalBalancesArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalBalances_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalDelegationsArgs = {
  address: Scalars['String']['input'];
  delegateAddressIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalTokenDataArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHistoricalVotingPowerArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPower_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryHistoricalVotingPowerByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPowerByAccountId_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLastUpdateArgs = {
  chart: QueryInput_LastUpdate_Chart;
};


export type QueryOffchainProposalByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryOffchainProposalNonVotersArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOffchainProposalsArgs = {
  endDate?: InputMaybe<Scalars['Int']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<InputMaybe<QueryInput_OffchainProposals_Status_Items>>>;
};


export type QueryProposalArgs = {
  id: Scalars['String']['input'];
};


export type QueryProposalNonVotersArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProposalsArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromEndDate?: InputMaybe<Scalars['Int']['input']>;
  includeOptimisticProposals?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<InputMaybe<QueryInput_Proposals_Status_Items>>>;
};


export type QueryProposalsActivityArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_ProposalsActivity_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userVoteFilter?: InputMaybe<QueryInput_ProposalsActivity_UserVoteFilter>;
};


export type QueryTokenArgs = {
  currency?: InputMaybe<QueryInput_Token_Currency>;
};


export type QueryTokenMetricsArgs = {
  endDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  metricType: QueryInput_TokenMetrics_MetricType;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransactionsArgs = {
  affectedSupply?: InputMaybe<Array<InputMaybe<QueryInput_Transactions_AffectedSupply_Items>>>;
  from?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  includes?: InputMaybe<Array<InputMaybe<QueryInput_Transactions_Includes_Items>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  maxAmount?: InputMaybe<Scalars['String']['input']>;
  minAmount?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransfersArgs = {
  address: Scalars['String']['input'];
  from?: InputMaybe<Scalars['String']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_Transfers_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVotesArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_Votes_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  support?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  voterAddressIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVotesByProposalIdArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesByProposalId_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  support?: InputMaybe<Scalars['String']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  voterAddressIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVotesOffchainArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesOffchain_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  voterAddresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVotesOffchainByProposalIdArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesOffchainByProposalId_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  voterAddresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryVotingPowerByAccountIdArgs = {
  accountId: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryVotingPowerVariationsArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryVotingPowerVariationsByAccountIdArgs = {
  address: Scalars['String']['input'];
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryVotingPowersArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromValue?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotingPowers_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  toValue?: InputMaybe<Scalars['String']['input']>;
};

/** Supply metric comparison between current and previous periods. */
export type SupplyComparisonResponse = {
  __typename?: 'SupplyComparisonResponse';
  changeRate: Scalars['Float']['output'];
  currentValue: Scalars['String']['output'];
  previousValue: Scalars['String']['output'];
};

export type TokenHistoricalPriceItem = {
  __typename?: 'TokenHistoricalPriceItem';
  /** Historical price value as a decimal string. */
  price: Scalars['String']['output'];
  /** Unix timestamp in seconds. */
  timestamp: Scalars['Int']['output'];
};

export type TokenMetricItem = {
  __typename?: 'TokenMetricItem';
  /** Unix day bucket represented as a timestamp string. */
  date: Scalars['String']['output'];
  /** Highest observed value for the period. */
  high: Scalars['String']['output'];
  /** Total volume observed for the period. */
  volume: Scalars['String']['output'];
};

export type TokenMetricsResponse = {
  __typename?: 'TokenMetricsResponse';
  items: Array<Maybe<TokenMetricItem>>;
  pageInfo: PageInfo;
};

/** Token properties enriched with the current token price. */
export type TokenPropertiesResponse = {
  __typename?: 'TokenPropertiesResponse';
  cexSupply: Scalars['String']['output'];
  circulatingSupply: Scalars['String']['output'];
  /** Token decimals. */
  decimals: Scalars['Int']['output'];
  delegatedSupply: Scalars['String']['output'];
  dexSupply: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lendingSupply: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  nonCirculatingSupply: Scalars['String']['output'];
  price: Scalars['String']['output'];
  totalSupply: Scalars['String']['output'];
  treasury: Scalars['String']['output'];
};

/** Transaction response enriched with transfer and delegation events. */
export type Transaction = {
  __typename?: 'Transaction';
  delegations: Array<Maybe<TransactionDelegation>>;
  /** Resolved sender address, if known. */
  from?: Maybe<Scalars['String']['output']>;
  /** Whether the transaction touched a centralized exchange. */
  isCex: Scalars['Boolean']['output'];
  /** Whether the transaction touched a decentralized exchange. */
  isDex: Scalars['Boolean']['output'];
  /** Whether the transaction touched a lending protocol. */
  isLending: Scalars['Boolean']['output'];
  /** Whether the transaction counts toward total tracked supply. */
  isTotal: Scalars['Boolean']['output'];
  /** Transaction timestamp in Unix seconds as a string. */
  timestamp: Scalars['String']['output'];
  /** Resolved recipient address, if known. */
  to?: Maybe<Scalars['String']['output']>;
  /** Transaction hash. */
  transactionHash: Scalars['String']['output'];
  transfers: Array<Maybe<Transfer>>;
};

/** Delegation event embedded within a transaction response. */
export type TransactionDelegation = {
  __typename?: 'TransactionDelegation';
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  /** Delegate address. */
  delegateAccountId: Scalars['String']['output'];
  /** Delegated amount encoded as a decimal string. */
  delegatedValue: Scalars['String']['output'];
  /** Delegator address. */
  delegatorAccountId: Scalars['String']['output'];
  /** Whether the delegation touched a centralized exchange. */
  isCex: Scalars['Boolean']['output'];
  /** Whether the delegation touched a decentralized exchange. */
  isDex: Scalars['Boolean']['output'];
  /** Whether the delegation touched a lending protocol. */
  isLending: Scalars['Boolean']['output'];
  /** Whether the delegation counts toward total tracked supply. */
  isTotal: Scalars['Boolean']['output'];
  /** Log index within the transaction receipt. */
  logIndex: Scalars['Int']['output'];
  /** Previous delegate address, if one existed. */
  previousDelegate?: Maybe<Scalars['String']['output']>;
  /** Delegation timestamp in Unix seconds as a string. */
  timestamp: Scalars['String']['output'];
  /** Transaction hash. */
  transactionHash: Scalars['String']['output'];
};

/** Paginated transactions with embedded transfer and delegation data. */
export type TransactionsResponse = {
  __typename?: 'TransactionsResponse';
  items: Array<Maybe<Transaction>>;
  /** Total number of matching transactions. */
  totalCount: Scalars['Int']['output'];
};

export type Transfer = {
  __typename?: 'Transfer';
  /** Transferred amount encoded as a decimal string. */
  amount: Scalars['String']['output'];
  /** DAO identifier. */
  daoId: Scalars['String']['output'];
  /** Sender address. */
  fromAccountId: Scalars['String']['output'];
  /** Whether the transfer touched a centralized exchange. */
  isCex: Scalars['Boolean']['output'];
  /** Whether the transfer touched a decentralized exchange. */
  isDex: Scalars['Boolean']['output'];
  /** Whether the transfer touched a lending protocol. */
  isLending: Scalars['Boolean']['output'];
  /** Whether the transfer counts toward total tracked supply. */
  isTotal: Scalars['Boolean']['output'];
  /** Log index within the transaction receipt. */
  logIndex: Scalars['Int']['output'];
  /** Transfer timestamp in Unix seconds as a string. */
  timestamp: Scalars['String']['output'];
  /** Recipient address. */
  toAccountId: Scalars['String']['output'];
  /** Token contract address. */
  tokenId: Scalars['String']['output'];
  /** Transaction hash. */
  transactionHash: Scalars['String']['output'];
};

export type TransfersResponse = {
  __typename?: 'TransfersResponse';
  items: Array<Maybe<Transfer>>;
  /** Total number of matching transfers. */
  totalCount: Scalars['Int']['output'];
};

/** Single treasury time-series datapoint. */
export type TreasuryItem = {
  __typename?: 'TreasuryItem';
  /** Unix timestamp in milliseconds */
  date: Scalars['Float']['output'];
  /** Treasury value in USD */
  value: Scalars['Float']['output'];
};

/** Paginated treasury time-series response. */
export type TreasuryResponse = {
  __typename?: 'TreasuryResponse';
  items: Array<Maybe<TreasuryItem>>;
  /** Total number of items */
  totalCount: Scalars['Int']['output'];
};

/** Voter or non-voter record associated with a proposal. */
export type Voter = {
  __typename?: 'Voter';
  lastVoteTimestamp: Scalars['Float']['output'];
  voter: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
  votingPowerVariation: Scalars['String']['output'];
};

/** Paginated voter or non-voter records for a proposal. */
export type VotersResponse = {
  __typename?: 'VotersResponse';
  items: Array<Maybe<Voter>>;
  totalCount: Scalars['Int']['output'];
};

/** Vote-count comparison between two adjacent time windows. */
export type VotesComparisonResponse = {
  __typename?: 'VotesComparisonResponse';
  /** Relative change between current and previous periods. */
  changeRate: Scalars['Float']['output'];
  /** Number of votes cast in the current period. */
  currentVotes: Scalars['Int']['output'];
  /** Number of votes cast in the comparison period. */
  oldVotes: Scalars['Int']['output'];
};

/** Current voting power snapshot for one account. */
export type VotingPower = {
  __typename?: 'VotingPower';
  /** Account address. */
  accountId: Scalars['String']['output'];
  /** Current token balance encoded as a decimal string. */
  balance?: Maybe<Scalars['String']['output']>;
  /** Total delegations associated with the account. */
  delegationsCount: Scalars['Int']['output'];
  /** Total proposals created by the account. */
  proposalsCount: Scalars['Int']['output'];
  variation: VotingPowerVariationField;
  /** Total votes cast by the account. */
  votesCount: Scalars['Int']['output'];
  /** Current voting power encoded as a decimal string. */
  votingPower: Scalars['String']['output'];
};

/** Voting power delta for a single account across two timestamps. */
export type VotingPowerVariation = {
  __typename?: 'VotingPowerVariation';
  /** Absolute voting power change encoded as a decimal string. */
  absoluteChange: Scalars['String']['output'];
  /** Account address. */
  accountId: Scalars['String']['output'];
  /** Voting power at the end of the comparison window. */
  currentVotingPower: Scalars['String']['output'];
  /** Relative voting power change encoded as a decimal string. */
  percentageChange: Scalars['String']['output'];
  /** Voting power at the start of the comparison window. */
  previousVotingPower: Scalars['String']['output'];
};

/** Embedded voting power delta metadata for a current voting power row. */
export type VotingPowerVariationField = {
  __typename?: 'VotingPowerVariationField';
  absoluteChange: Scalars['String']['output'];
  percentageChange: Scalars['String']['output'];
};

/** Voting power variation response for a single account. */
export type VotingPowerVariationsByAccountIdResponse = {
  __typename?: 'VotingPowerVariationsByAccountIdResponse';
  data: VotingPowerVariation;
  period: PeriodResponse;
};

/** List of voting power variations for multiple accounts in the selected period. */
export type VotingPowerVariationsResponse = {
  __typename?: 'VotingPowerVariationsResponse';
  items: Array<Maybe<VotingPowerVariation>>;
  period: PeriodResponse;
};

/** Paginated current voting power records. */
export type VotingPowersResponse = {
  __typename?: 'VotingPowersResponse';
  items: Array<Maybe<VotingPower>>;
  /** Total number of matching voting power rows. */
  totalCount: Scalars['Int']['output'];
};

export enum Error_Const {
  Error = 'error'
}

export type GetAddress_200_Response = {
  __typename?: 'getAddress_200_response';
  /** EIP-55 checksummed Ethereum address */
  address: Scalars['String']['output'];
  arkham?: Maybe<Query_GetAddress_Arkham>;
  ens?: Maybe<Query_GetAddress_Ens>;
  /** Whether the address is a smart contract (true) or an externally-owned account (false) */
  isContract: Scalars['Boolean']['output'];
};

export type GetAddresses_200_Response = {
  __typename?: 'getAddresses_200_response';
  /** Enrichment results for each successfully resolved address. Addresses that failed to resolve are omitted. */
  results: Array<Maybe<Query_GetAddresses_Results_Items>>;
};

export type OffchainProposalById_Response = ErrorResponse | OffchainProposal;

export type OffchainProposalNonVoters_200_Response = {
  __typename?: 'offchainProposalNonVoters_200_response';
  items: Array<Maybe<Query_OffchainProposalNonVoters_Items_Items>>;
  totalCount: Scalars['Float']['output'];
};

export type Proposal_Response = ErrorResponse | OnchainProposal;

export type Proposal_Response = ErrorResponse | OnchainProposal;

export enum QueryInput_AccountBalances_OrderBy {
  Balance = 'balance',
  SignedVariation = 'signedVariation',
  Variation = 'variation'
}

/** Field used to sort interaction rows. */
export enum QueryInput_AccountInteractions_OrderBy {
  Count = 'count',
  Volume = 'volume'
}

export enum QueryInput_Delegators_OrderBy {
  Amount = 'amount',
  Timestamp = 'timestamp'
}

/** Field used to sort feed events. */
export enum QueryInput_FeedEvents_OrderBy {
  Timestamp = 'timestamp',
  Value = 'value'
}

/** Filter events by relevance tier. */
export enum QueryInput_FeedEvents_Relevance {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

/** Filter events by governance activity type. */
export enum QueryInput_FeedEvents_Type {
  Delegation = 'DELEGATION',
  Proposal = 'PROPOSAL',
  ProposalExtended = 'PROPOSAL_EXTENDED',
  Transfer = 'TRANSFER',
  Vote = 'VOTE'
}

/** Field used to sort historical balance rows. */
export enum QueryInput_HistoricalBalances_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

/** Field used to sort historical voting power rows. */
export enum QueryInput_HistoricalVotingPowerByAccountId_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

/** Field used to sort historical voting power rows. */
export enum QueryInput_HistoricalVotingPower_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

/** Chart identifier whose freshness timestamp should be returned. */
export enum QueryInput_LastUpdate_Chart {
  AttackProfitability = 'attack_profitability',
  CostComparison = 'cost_comparison',
  TokenDistribution = 'token_distribution'
}

export enum QueryInput_OffchainProposals_Status_Items {
  Active = 'active',
  Closed = 'closed',
  Pending = 'pending'
}

/** Field used to sort proposal activity results. */
export enum QueryInput_ProposalsActivity_OrderBy {
  Timestamp = 'timestamp',
  VoteTiming = 'voteTiming',
  VotingPower = 'votingPower'
}

/** Optional vote filter. Use yes, no, abstain, or no-vote to narrow the result set. */
export enum QueryInput_ProposalsActivity_UserVoteFilter {
  Abstain = 'abstain',
  No = 'no',
  NoVote = 'no_vote',
  Yes = 'yes'
}

export enum QueryInput_Proposals_Status_Items {
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Defeated = 'DEFEATED',
  Executed = 'EXECUTED',
  Expired = 'EXPIRED',
  NoQuorum = 'NO_QUORUM',
  Pending = 'PENDING',
  PendingExecution = 'PENDING_EXECUTION',
  Queued = 'QUEUED',
  Succeeded = 'SUCCEEDED',
  Vetoed = 'VETOED'
}

/** Metric family to query. */
export enum QueryInput_TokenMetrics_MetricType {
  CexSupply = 'CEX_SUPPLY',
  CirculatingSupply = 'CIRCULATING_SUPPLY',
  DelegatedSupply = 'DELEGATED_SUPPLY',
  DexSupply = 'DEX_SUPPLY',
  LendingSupply = 'LENDING_SUPPLY',
  TotalSupply = 'TOTAL_SUPPLY',
  Treasury = 'TREASURY'
}

/** Currency to use when fetching token price data. */
export enum QueryInput_Token_Currency {
  Eth = 'eth',
  Usd = 'usd'
}

export enum QueryInput_Transactions_AffectedSupply_Items {
  Cex = 'CEX',
  Dex = 'DEX',
  Lending = 'LENDING',
  Total = 'TOTAL',
  Unassigned = 'UNASSIGNED'
}

export enum QueryInput_Transactions_Includes_Items {
  Delegation = 'DELEGATION',
  Transfer = 'TRANSFER'
}

/** Field used to sort transfers. */
export enum QueryInput_Transfers_OrderBy {
  Amount = 'amount',
  Timestamp = 'timestamp'
}

/** Sort votes by timestamp or voting power. */
export enum QueryInput_VotesByProposalId_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

/** Sort votes by timestamp or voting power. */
export enum QueryInput_VotesOffchainByProposalId_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

/** Sort votes by timestamp or voting power. */
export enum QueryInput_VotesOffchain_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

/** Sort votes by timestamp or voting power. */
export enum QueryInput_Votes_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

export enum QueryInput_VotingPowers_OrderBy {
  Balance = 'balance',
  DelegationsCount = 'delegationsCount',
  SignedVariation = 'signedVariation',
  Total = 'total',
  Variation = 'variation',
  VotingPower = 'votingPower'
}

/** Arkham Intelligence label data. null when no data is available for the address. */
export type Query_GetAddress_Arkham = {
  __typename?: 'query_getAddress_arkham';
  /** Human-readable name of the entity that owns the address according to Arkham Intelligence */
  entity?: Maybe<Scalars['String']['output']>;
  /** Category of the entity (e.g. 'individual', 'exchange', 'protocol', 'fund') */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Fine-grained label for the specific address within the entity */
  label?: Maybe<Scalars['String']['output']>;
  /** Twitter/X handle associated with the entity, without '@' */
  twitter?: Maybe<Scalars['String']['output']>;
};

/** ENS (Ethereum Name Service) data. null when no ENS name is registered for the address. Cached with a configurable TTL. */
export type Query_GetAddress_Ens = {
  __typename?: 'query_getAddress_ens';
  /** URL of the ENS avatar image */
  avatar?: Maybe<Scalars['URL']['output']>;
  /** URL of the ENS profile banner image */
  banner?: Maybe<Scalars['String']['output']>;
  /** Primary ENS name reverse-resolved for this address */
  name?: Maybe<Scalars['String']['output']>;
};

export type Query_GetAddresses_Results_Items = {
  __typename?: 'query_getAddresses_results_items';
  /** EIP-55 checksummed Ethereum address */
  address: Scalars['String']['output'];
  arkham?: Maybe<Query_GetAddresses_Results_Items_Arkham>;
  ens?: Maybe<Query_GetAddresses_Results_Items_Ens>;
  /** Whether the address is a smart contract (true) or an externally-owned account (false) */
  isContract: Scalars['Boolean']['output'];
};

/** Arkham Intelligence label data. null when no data is available for the address. */
export type Query_GetAddresses_Results_Items_Arkham = {
  __typename?: 'query_getAddresses_results_items_arkham';
  /** Human-readable name of the entity that owns the address according to Arkham Intelligence */
  entity?: Maybe<Scalars['String']['output']>;
  /** Category of the entity (e.g. 'individual', 'exchange', 'protocol', 'fund') */
  entityType?: Maybe<Scalars['String']['output']>;
  /** Fine-grained label for the specific address within the entity */
  label?: Maybe<Scalars['String']['output']>;
  /** Twitter/X handle associated with the entity, without '@' */
  twitter?: Maybe<Scalars['String']['output']>;
};

/** ENS (Ethereum Name Service) data. null when no ENS name is registered for the address. Cached with a configurable TTL. */
export type Query_GetAddresses_Results_Items_Ens = {
  __typename?: 'query_getAddresses_results_items_ens';
  /** URL of the ENS avatar image */
  avatar?: Maybe<Scalars['URL']['output']>;
  /** URL of the ENS profile banner image */
  banner?: Maybe<Scalars['String']['output']>;
  /** Primary ENS name reverse-resolved for this address */
  name?: Maybe<Scalars['String']['output']>;
};

export type Query_OffchainProposalNonVoters_Items_Items = {
  __typename?: 'query_offchainProposalNonVoters_items_items';
  voter: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
};

export type Query_OffchainProposals_Items_Items_Strategies_Items = {
  __typename?: 'query_offchainProposals_items_items_strategies_items';
  name: Scalars['String']['output'];
  network: Scalars['String']['output'];
  params: Scalars['JSON']['output'];
};

export type Token_Response = ErrorResponse | TokenPropertiesResponse;

export type GetDaOsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDaOsQuery = { __typename?: 'Query', daos: { __typename?: 'DAOList', items: Array<{ __typename?: 'DaoResponse', id: string, votingDelay: string, chainId: number, alreadySupportCalldataReview: boolean, supportOffchainData: boolean }> } };

export type OffchainProposalNonVotersQueryVariables = Exact<{
  id: Scalars['String']['input'];
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type OffchainProposalNonVotersQuery = { __typename?: 'Query', offchainProposalNonVoters?: { __typename?: 'offchainProposalNonVoters_200_response', items: Array<{ __typename?: 'query_offchainProposalNonVoters_items_items', voter: string, votingPower: string } | null> } | null };

export type ListOffchainProposalsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  status?: InputMaybe<Array<InputMaybe<QueryInput_OffchainProposals_Status_Items>> | InputMaybe<QueryInput_OffchainProposals_Status_Items>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  endDate?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListOffchainProposalsQuery = { __typename?: 'Query', offchainProposals?: { __typename?: 'OffchainProposalsResponse', totalCount: number, items: Array<{ __typename?: 'OffchainProposal', id: string, title: string, discussion: string, link: string, state: string, created: number, end: number } | null> } | null };

export type ListOffchainVotesQueryVariables = Exact<{
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesOffchain_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  voterAddresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


export type ListOffchainVotesQuery = { __typename?: 'Query', votesOffchain?: { __typename?: 'OffchainVotesResponse', totalCount: number, items: Array<{ __typename?: 'OffchainVote', voter: string, created: number, proposalId: string, proposalTitle?: string | null, reason: string, vp?: number | null } | null> } | null };

export type ProposalNonVotersQueryVariables = Exact<{
  id: Scalars['String']['input'];
  addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;


export type ProposalNonVotersQuery = { __typename?: 'Query', proposalNonVoters?: { __typename?: 'VotersResponse', items: Array<{ __typename?: 'Voter', voter: string } | null> } | null };

export type GetProposalByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetProposalByIdQuery = { __typename?: 'Query', proposal?: { __typename?: 'ErrorResponse' } | { __typename?: 'OnchainProposal', id: string, daoId: string, proposerAccountId: string, title: string, description: string, startBlock: number, endBlock: number, endTimestamp: number, timestamp: number, status: string, forVotes: string, againstVotes: string, abstainVotes: string, txHash: string } | null };

export type ListProposalsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  status?: InputMaybe<Array<InputMaybe<QueryInput_Proposals_Status_Items>> | InputMaybe<QueryInput_Proposals_Status_Items>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  fromEndDate?: InputMaybe<Scalars['Int']['input']>;
  includeOptimisticProposals?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ListProposalsQuery = { __typename?: 'Query', proposals?: { __typename?: 'OnchainProposalsResponse', totalCount: number, items: Array<{ __typename?: 'OnchainProposal', id: string, daoId: string, proposerAccountId: string, title: string, description: string, startBlock: number, endBlock: number, endTimestamp: number, timestamp: number, status: string, forVotes: string, againstVotes: string, abstainVotes: string, txHash: string } | null> } | null };

export type GetEventRelevanceThresholdQueryVariables = Exact<{
  relevance: FeedRelevance;
  type: FeedEventType;
}>;


export type GetEventRelevanceThresholdQuery = { __typename?: 'Query', getEventRelevanceThreshold?: { __typename?: 'EventRelevanceThresholdResponse', threshold: string } | null };

export type ListVotesQueryVariables = Exact<{
  voterAddressIn?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_Votes_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  support?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListVotesQuery = { __typename?: 'Query', votes?: { __typename?: 'OnchainVotesResponse', totalCount: number, items: Array<{ __typename?: 'OnchainVote', transactionHash: string, proposalId: string, voterAddress: string, support?: string | null, votingPower: string, timestamp: number, reason?: string | null, proposalTitle?: string | null } | null> } | null };

export type ListHistoricalVotingPowerQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_HistoricalVotingPower_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
}>;


export type ListHistoricalVotingPowerQuery = { __typename?: 'Query', historicalVotingPower?: { __typename?: 'HistoricalVotingPowersResponse', totalCount: number, items: Array<{ __typename?: 'HistoricalVotingPower', accountId: string, timestamp: string, votingPower: string, delta: string, daoId: string, transactionHash: string, logIndex: number, delegation?: { __typename?: 'HistoricalVotingPowerDelegation', from: string, to: string, value: string, previousDelegate?: string | null } | null, transfer?: { __typename?: 'HistoricalVotingPowerTransfer', from: string, to: string, value: string } | null } | null> } | null };


export const GetDaOsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDAOs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"daos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"votingDelay"}},{"kind":"Field","name":{"kind":"Name","value":"chainId"}},{"kind":"Field","name":{"kind":"Name","value":"alreadySupportCalldataReview"}},{"kind":"Field","name":{"kind":"Name","value":"supportOffchainData"}}]}}]}}]}}]} as unknown as DocumentNode<GetDaOsQuery, GetDaOsQueryVariables>;
export const OffchainProposalNonVotersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OffchainProposalNonVoters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offchainProposalNonVoters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"addresses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voter"}},{"kind":"Field","name":{"kind":"Name","value":"votingPower"}}]}}]}}]}}]} as unknown as DocumentNode<OffchainProposalNonVotersQuery, OffchainProposalNonVotersQueryVariables>;
export const ListOffchainProposalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOffchainProposals"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_offchainProposals_status_items"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offchainProposals"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"discussion"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListOffchainProposalsQuery, ListOffchainProposalsQueryVariables>;
export const ListOffchainVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOffchainVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_votesOffchain_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"voterAddresses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votesOffchain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"voterAddresses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"voterAddresses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voter"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"proposalId"}},{"kind":"Field","name":{"kind":"Name","value":"proposalTitle"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"vp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListOffchainVotesQuery, ListOffchainVotesQueryVariables>;
export const ProposalNonVotersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProposalNonVoters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposalNonVoters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"addresses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voter"}}]}}]}}]}}]} as unknown as DocumentNode<ProposalNonVotersQuery, ProposalNonVotersQueryVariables>;
export const GetProposalByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProposalById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnchainProposal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"proposerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forVotes"}},{"kind":"Field","name":{"kind":"Name","value":"againstVotes"}},{"kind":"Field","name":{"kind":"Name","value":"abstainVotes"}},{"kind":"Field","name":{"kind":"Name","value":"txHash"}}]}}]}}]}}]} as unknown as DocumentNode<GetProposalByIdQuery, GetProposalByIdQueryVariables>;
export const ListProposalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListProposals"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_proposals_status_items"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromEndDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeOptimisticProposals"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposals"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromEndDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromEndDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeOptimisticProposals"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeOptimisticProposals"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"proposerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forVotes"}},{"kind":"Field","name":{"kind":"Name","value":"againstVotes"}},{"kind":"Field","name":{"kind":"Name","value":"abstainVotes"}},{"kind":"Field","name":{"kind":"Name","value":"txHash"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListProposalsQuery, ListProposalsQueryVariables>;
export const GetEventRelevanceThresholdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventRelevanceThreshold"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"relevance"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedRelevance"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedEventType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEventRelevanceThreshold"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"relevance"},"value":{"kind":"Variable","name":{"kind":"Name","value":"relevance"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threshold"}}]}}]}}]} as unknown as DocumentNode<GetEventRelevanceThresholdQuery, GetEventRelevanceThresholdQueryVariables>;
export const ListVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"voterAddressIn"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_votes_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"support"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"voterAddressIn"},"value":{"kind":"Variable","name":{"kind":"Name","value":"voterAddressIn"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"support"},"value":{"kind":"Variable","name":{"kind":"Name","value":"support"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactionHash"}},{"kind":"Field","name":{"kind":"Name","value":"proposalId"}},{"kind":"Field","name":{"kind":"Name","value":"voterAddress"}},{"kind":"Field","name":{"kind":"Name","value":"support"}},{"kind":"Field","name":{"kind":"Name","value":"votingPower"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"proposalTitle"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListVotesQuery, ListVotesQueryVariables>;
export const ListHistoricalVotingPowerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListHistoricalVotingPower"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_historicalVotingPower_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"historicalVotingPower"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"votingPower"}},{"kind":"Field","name":{"kind":"Name","value":"delta"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"transactionHash"}},{"kind":"Field","name":{"kind":"Name","value":"logIndex"}},{"kind":"Field","name":{"kind":"Name","value":"delegation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"previousDelegate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transfer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListHistoricalVotingPowerQuery, ListHistoricalVotingPowerQueryVariables>;