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
  JSON: { input: any; output: any; }
};

export type DaoList = {
  __typename?: 'DAOList';
  items: Array<Dao_200_Response>;
  totalCount: Scalars['Int']['output'];
};

export type ErrorResponse = {
  __typename?: 'ErrorResponse';
  error: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
};

export type EventRelevanceThresholdResponse = {
  __typename?: 'EventRelevanceThresholdResponse';
  threshold: Scalars['String']['output'];
};

export enum FeedEventType {
  Delegation = 'DELEGATION',
  Proposal = 'PROPOSAL',
  ProposalExtended = 'PROPOSAL_EXTENDED',
  Transfer = 'TRANSFER',
  Vote = 'VOTE'
}

export enum FeedRelevance {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type HistoricalVotingPower = {
  __typename?: 'HistoricalVotingPower';
  accountId: Scalars['String']['output'];
  daoId: Scalars['String']['output'];
  delegation?: Maybe<HistoricalVotingPowerDelegation>;
  delta: Scalars['String']['output'];
  logIndex: Scalars['Int']['output'];
  timestamp: Scalars['String']['output'];
  transactionHash: Scalars['String']['output'];
  transfer?: Maybe<HistoricalVotingPowerTransfer>;
  votingPower: Scalars['String']['output'];
};

export type HistoricalVotingPowerDelegation = {
  __typename?: 'HistoricalVotingPowerDelegation';
  from: Scalars['String']['output'];
  previousDelegate?: Maybe<Scalars['String']['output']>;
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type HistoricalVotingPowerTransfer = {
  __typename?: 'HistoricalVotingPowerTransfer';
  from: Scalars['String']['output'];
  to: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type HistoricalVotingPowersResponse = {
  __typename?: 'HistoricalVotingPowersResponse';
  items: Array<Maybe<HistoricalVotingPower>>;
  totalCount: Scalars['Int']['output'];
};

export type OffchainProposal = {
  __typename?: 'OffchainProposal';
  author: Scalars['String']['output'];
  body: Scalars['String']['output'];
  created: Scalars['Int']['output'];
  discussion: Scalars['String']['output'];
  end: Scalars['Int']['output'];
  flagged: Scalars['Boolean']['output'];
  id: Scalars['String']['output'];
  link: Scalars['String']['output'];
  spaceId: Scalars['String']['output'];
  start: Scalars['Int']['output'];
  state: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
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
  abstainVotes: Scalars['String']['output'];
  againstVotes: Scalars['String']['output'];
  calldatas: Array<Maybe<Scalars['String']['output']>>;
  daoId: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endBlock: Scalars['Int']['output'];
  endTimestamp: Scalars['Int']['output'];
  forVotes: Scalars['String']['output'];
  id: Scalars['String']['output'];
  proposalType?: Maybe<Scalars['Int']['output']>;
  proposerAccountId: Scalars['String']['output'];
  quorum: Scalars['String']['output'];
  startBlock: Scalars['Int']['output'];
  startTimestamp: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  targets: Array<Maybe<Scalars['String']['output']>>;
  timestamp: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
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
  support?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['Int']['output'];
  transactionHash: Scalars['String']['output'];
  voterAddress: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
};

export type OnchainVotesResponse = {
  __typename?: 'OnchainVotesResponse';
  items: Array<Maybe<OnchainVote>>;
  totalCount: Scalars['Int']['output'];
};

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Query = {
  __typename?: 'Query';
  daos: DaoList;
  getEventRelevanceThreshold?: Maybe<EventRelevanceThresholdResponse>;
  historicalVotingPower?: Maybe<HistoricalVotingPowersResponse>;
  offchainProposals?: Maybe<OffchainProposalsResponse>;
  proposal?: Maybe<Proposal_Response>;
  proposalNonVoters?: Maybe<VotersResponse>;
  proposals?: Maybe<OnchainProposalsResponse>;
  votes?: Maybe<OnchainVotesResponse>;
  votesOffchain?: Maybe<OffchainVotesResponse>;
};


export type QueryGetEventRelevanceThresholdArgs = {
  relevance: FeedRelevance;
  type: FeedEventType;
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


export type QueryOffchainProposalsArgs = {
  endDate?: InputMaybe<Scalars['Int']['input']>;
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
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


export type QueryVotesOffchainArgs = {
  fromDate?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<QueryInput_VotesOffchain_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  toDate?: InputMaybe<Scalars['Int']['input']>;
  voterAddresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Voter = {
  __typename?: 'Voter';
  lastVoteTimestamp: Scalars['Float']['output'];
  voter: Scalars['String']['output'];
  votingPower: Scalars['String']['output'];
  votingPowerVariation: Scalars['String']['output'];
};

export type VotersResponse = {
  __typename?: 'VotersResponse';
  items: Array<Maybe<Voter>>;
  totalCount: Scalars['Int']['output'];
};

export type Dao_200_Response = {
  __typename?: 'dao_200_response';
  alreadySupportCalldataReview: Scalars['Boolean']['output'];
  chainId: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  supportOffchainData: Scalars['Boolean']['output'];
  votingDelay: Scalars['String']['output'];
};

export type Proposal_Response = ErrorResponse | OnchainProposal;

export enum QueryInput_HistoricalVotingPower_OrderBy {
  Delta = 'delta',
  Timestamp = 'timestamp'
}

export enum QueryInput_VotesOffchain_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

export enum QueryInput_Votes_OrderBy {
  Timestamp = 'timestamp',
  VotingPower = 'votingPower'
}

export type GetDaOsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDaOsQuery = { __typename?: 'Query', daos: { __typename?: 'DAOList', items: Array<{ __typename?: 'dao_200_response', id: string, votingDelay: string, chainId: number, alreadySupportCalldataReview: boolean, supportOffchainData: boolean }> } };

export type ListOffchainProposalsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
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


export type GetProposalByIdQuery = { __typename?: 'Query', proposal?: { __typename?: 'ErrorResponse', error: string, message?: string | null } | { __typename?: 'OnchainProposal', id: string, daoId: string, proposerAccountId: string, title: string, description: string, startBlock: number, endBlock: number, endTimestamp: number, timestamp: number, status: string, forVotes: string, againstVotes: string, abstainVotes: string, txHash: string } | null };

export type ListProposalsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
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
export const ListOffchainProposalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOffchainProposals"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"offchainProposals"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"discussion"}},{"kind":"Field","name":{"kind":"Name","value":"link"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"end"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListOffchainProposalsQuery, ListOffchainProposalsQueryVariables>;
export const ListOffchainVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOffchainVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_votesOffchain_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"voterAddresses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votesOffchain"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"voterAddresses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"voterAddresses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voter"}},{"kind":"Field","name":{"kind":"Name","value":"created"}},{"kind":"Field","name":{"kind":"Name","value":"proposalId"}},{"kind":"Field","name":{"kind":"Name","value":"proposalTitle"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"vp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListOffchainVotesQuery, ListOffchainVotesQueryVariables>;
export const ProposalNonVotersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProposalNonVoters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposalNonVoters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"addresses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"addresses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"voter"}}]}}]}}]}}]} as unknown as DocumentNode<ProposalNonVotersQuery, ProposalNonVotersQueryVariables>;
export const GetProposalByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetProposalById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposal"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OnchainProposal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"proposerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forVotes"}},{"kind":"Field","name":{"kind":"Name","value":"againstVotes"}},{"kind":"Field","name":{"kind":"Name","value":"abstainVotes"}},{"kind":"Field","name":{"kind":"Name","value":"txHash"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ErrorResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<GetProposalByIdQuery, GetProposalByIdQueryVariables>;
export const ListProposalsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListProposals"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromEndDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeOptimisticProposals"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"proposals"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromEndDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromEndDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeOptimisticProposals"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeOptimisticProposals"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"proposerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endBlock"}},{"kind":"Field","name":{"kind":"Name","value":"endTimestamp"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"forVotes"}},{"kind":"Field","name":{"kind":"Name","value":"againstVotes"}},{"kind":"Field","name":{"kind":"Name","value":"abstainVotes"}},{"kind":"Field","name":{"kind":"Name","value":"txHash"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListProposalsQuery, ListProposalsQueryVariables>;
export const GetEventRelevanceThresholdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetEventRelevanceThreshold"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"relevance"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedRelevance"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedEventType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getEventRelevanceThreshold"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"relevance"},"value":{"kind":"Variable","name":{"kind":"Name","value":"relevance"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threshold"}}]}}]}}]} as unknown as DocumentNode<GetEventRelevanceThresholdQuery, GetEventRelevanceThresholdQueryVariables>;
export const ListVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"voterAddressIn"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_votes_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"support"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"voterAddressIn"},"value":{"kind":"Variable","name":{"kind":"Name","value":"voterAddressIn"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"toDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"support"},"value":{"kind":"Variable","name":{"kind":"Name","value":"support"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactionHash"}},{"kind":"Field","name":{"kind":"Name","value":"proposalId"}},{"kind":"Field","name":{"kind":"Name","value":"voterAddress"}},{"kind":"Field","name":{"kind":"Name","value":"support"}},{"kind":"Field","name":{"kind":"Name","value":"votingPower"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"proposalTitle"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListVotesQuery, ListVotesQueryVariables>;
export const ListHistoricalVotingPowerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListHistoricalVotingPower"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"queryInput_historicalVotingPower_orderBy"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"address"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"historicalVotingPower"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"fromDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fromDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"address"},"value":{"kind":"Variable","name":{"kind":"Name","value":"address"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"votingPower"}},{"kind":"Field","name":{"kind":"Name","value":"delta"}},{"kind":"Field","name":{"kind":"Name","value":"daoId"}},{"kind":"Field","name":{"kind":"Name","value":"transactionHash"}},{"kind":"Field","name":{"kind":"Name","value":"logIndex"}},{"kind":"Field","name":{"kind":"Name","value":"delegation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"previousDelegate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transfer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ListHistoricalVotingPowerQuery, ListHistoricalVotingPowerQueryVariables>;