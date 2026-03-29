import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends {
    [key: string]: unknown;
}> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<T extends {
    [key: string]: unknown;
}, K extends keyof T> = {
    [_ in K]?: never;
};
export type Incremental<T> = T | {
    [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: {
        input: string;
        output: string;
    };
    String: {
        input: string;
        output: string;
    };
    Boolean: {
        input: boolean;
        output: boolean;
    };
    Int: {
        input: number;
        output: number;
    };
    Float: {
        input: number;
        output: number;
    };
    JSON: {
        input: any;
        output: any;
    };
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
export declare enum FeedEventType {
    Delegation = "DELEGATION",
    Proposal = "PROPOSAL",
    ProposalExtended = "PROPOSAL_EXTENDED",
    Transfer = "TRANSFER",
    Vote = "VOTE"
}
export declare enum FeedRelevance {
    High = "HIGH",
    Low = "LOW",
    Medium = "MEDIUM"
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
export declare enum OrderDirection {
    Asc = "asc",
    Desc = "desc"
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
export declare enum QueryInput_HistoricalVotingPower_OrderBy {
    Delta = "delta",
    Timestamp = "timestamp"
}
export declare enum QueryInput_VotesOffchain_OrderBy {
    Timestamp = "timestamp",
    VotingPower = "votingPower"
}
export declare enum QueryInput_Votes_OrderBy {
    Timestamp = "timestamp",
    VotingPower = "votingPower"
}
export type GetDaOsQueryVariables = Exact<{
    [key: string]: never;
}>;
export type GetDaOsQuery = {
    __typename?: 'Query';
    daos: {
        __typename?: 'DAOList';
        items: Array<{
            __typename?: 'dao_200_response';
            id: string;
            votingDelay: string;
            chainId: number;
            alreadySupportCalldataReview: boolean;
            supportOffchainData: boolean;
        }>;
    };
};
export type ListOffchainProposalsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']['input']>;
    limit?: InputMaybe<Scalars['Int']['input']>;
    orderDirection?: InputMaybe<OrderDirection>;
    status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
    fromDate?: InputMaybe<Scalars['Int']['input']>;
    endDate?: InputMaybe<Scalars['Int']['input']>;
}>;
export type ListOffchainProposalsQuery = {
    __typename?: 'Query';
    offchainProposals?: {
        __typename?: 'OffchainProposalsResponse';
        totalCount: number;
        items: Array<{
            __typename?: 'OffchainProposal';
            id: string;
            title: string;
            discussion: string;
            link: string;
            state: string;
            created: number;
            end: number;
        } | null>;
    } | null;
};
export type ListOffchainVotesQueryVariables = Exact<{
    fromDate?: InputMaybe<Scalars['Int']['input']>;
    toDate?: InputMaybe<Scalars['Int']['input']>;
    limit?: InputMaybe<Scalars['Int']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<QueryInput_VotesOffchain_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    voterAddresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;
export type ListOffchainVotesQuery = {
    __typename?: 'Query';
    votesOffchain?: {
        __typename?: 'OffchainVotesResponse';
        totalCount: number;
        items: Array<{
            __typename?: 'OffchainVote';
            voter: string;
            created: number;
            proposalId: string;
            proposalTitle?: string | null;
            reason: string;
            vp?: number | null;
        } | null>;
    } | null;
};
export type ProposalNonVotersQueryVariables = Exact<{
    id: Scalars['String']['input'];
    addresses?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
}>;
export type ProposalNonVotersQuery = {
    __typename?: 'Query';
    proposalNonVoters?: {
        __typename?: 'VotersResponse';
        items: Array<{
            __typename?: 'Voter';
            voter: string;
        } | null>;
    } | null;
};
export type GetProposalByIdQueryVariables = Exact<{
    id: Scalars['String']['input'];
}>;
export type GetProposalByIdQuery = {
    __typename?: 'Query';
    proposal?: {
        __typename?: 'ErrorResponse';
        error: string;
        message?: string | null;
    } | {
        __typename?: 'OnchainProposal';
        id: string;
        daoId: string;
        proposerAccountId: string;
        title: string;
        description: string;
        startBlock: number;
        endBlock: number;
        endTimestamp: number;
        timestamp: number;
        status: string;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        txHash: string;
    } | null;
};
export type ListProposalsQueryVariables = Exact<{
    skip?: InputMaybe<Scalars['Int']['input']>;
    limit?: InputMaybe<Scalars['Int']['input']>;
    orderDirection?: InputMaybe<OrderDirection>;
    status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>> | InputMaybe<Scalars['String']['input']>>;
    fromDate?: InputMaybe<Scalars['Int']['input']>;
    fromEndDate?: InputMaybe<Scalars['Int']['input']>;
    includeOptimisticProposals?: InputMaybe<Scalars['Boolean']['input']>;
}>;
export type ListProposalsQuery = {
    __typename?: 'Query';
    proposals?: {
        __typename?: 'OnchainProposalsResponse';
        totalCount: number;
        items: Array<{
            __typename?: 'OnchainProposal';
            id: string;
            daoId: string;
            proposerAccountId: string;
            title: string;
            description: string;
            startBlock: number;
            endBlock: number;
            endTimestamp: number;
            timestamp: number;
            status: string;
            forVotes: string;
            againstVotes: string;
            abstainVotes: string;
            txHash: string;
        } | null>;
    } | null;
};
export type GetEventRelevanceThresholdQueryVariables = Exact<{
    relevance: FeedRelevance;
    type: FeedEventType;
}>;
export type GetEventRelevanceThresholdQuery = {
    __typename?: 'Query';
    getEventRelevanceThreshold?: {
        __typename?: 'EventRelevanceThresholdResponse';
        threshold: string;
    } | null;
};
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
export type ListVotesQuery = {
    __typename?: 'Query';
    votes?: {
        __typename?: 'OnchainVotesResponse';
        totalCount: number;
        items: Array<{
            __typename?: 'OnchainVote';
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            support?: string | null;
            votingPower: string;
            timestamp: number;
            reason?: string | null;
            proposalTitle?: string | null;
        } | null>;
    } | null;
};
export type ListHistoricalVotingPowerQueryVariables = Exact<{
    limit?: InputMaybe<Scalars['Int']['input']>;
    skip?: InputMaybe<Scalars['Int']['input']>;
    orderBy?: InputMaybe<QueryInput_HistoricalVotingPower_OrderBy>;
    orderDirection?: InputMaybe<OrderDirection>;
    fromDate?: InputMaybe<Scalars['Int']['input']>;
    address?: InputMaybe<Scalars['String']['input']>;
}>;
export type ListHistoricalVotingPowerQuery = {
    __typename?: 'Query';
    historicalVotingPower?: {
        __typename?: 'HistoricalVotingPowersResponse';
        totalCount: number;
        items: Array<{
            __typename?: 'HistoricalVotingPower';
            accountId: string;
            timestamp: string;
            votingPower: string;
            delta: string;
            daoId: string;
            transactionHash: string;
            logIndex: number;
            delegation?: {
                __typename?: 'HistoricalVotingPowerDelegation';
                from: string;
                to: string;
                value: string;
                previousDelegate?: string | null;
            } | null;
            transfer?: {
                __typename?: 'HistoricalVotingPowerTransfer';
                from: string;
                to: string;
                value: string;
            } | null;
        } | null>;
    } | null;
};
export declare const GetDaOsDocument: DocumentNode<GetDaOsQuery, GetDaOsQueryVariables>;
export declare const ListOffchainProposalsDocument: DocumentNode<ListOffchainProposalsQuery, ListOffchainProposalsQueryVariables>;
export declare const ListOffchainVotesDocument: DocumentNode<ListOffchainVotesQuery, ListOffchainVotesQueryVariables>;
export declare const ProposalNonVotersDocument: DocumentNode<ProposalNonVotersQuery, ProposalNonVotersQueryVariables>;
export declare const GetProposalByIdDocument: DocumentNode<GetProposalByIdQuery, GetProposalByIdQueryVariables>;
export declare const ListProposalsDocument: DocumentNode<ListProposalsQuery, ListProposalsQueryVariables>;
export declare const GetEventRelevanceThresholdDocument: DocumentNode<GetEventRelevanceThresholdQuery, GetEventRelevanceThresholdQueryVariables>;
export declare const ListVotesDocument: DocumentNode<ListVotesQuery, ListVotesQueryVariables>;
export declare const ListHistoricalVotingPowerDocument: DocumentNode<ListHistoricalVotingPowerQuery, ListHistoricalVotingPowerQueryVariables>;
