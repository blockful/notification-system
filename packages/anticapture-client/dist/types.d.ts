export declare enum OrderDirection {
    Asc = "asc",
    Desc = "desc"
}
export declare enum QueryInput_HistoricalVotingPower_OrderBy {
    Delta = "delta",
    Timestamp = "timestamp"
}
export declare enum QueryInput_Votes_OrderBy {
    Timestamp = "timestamp",
    VotingPower = "votingPower"
}
export declare enum QueryInput_VotesOffchain_OrderBy {
    Timestamp = "timestamp",
    VotingPower = "votingPower"
}
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
export interface Dao {
    id: string;
    chainId: number;
    quorum: string;
    proposalThreshold: string;
    votingDelay: string;
    votingPeriod: string;
    timelockDelay: string;
    alreadySupportCalldataReview: boolean;
    supportOffchainData: boolean;
}
export interface OnchainProposal {
    id: string;
    daoId: string;
    txHash: string;
    proposerAccountId: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    timestamp: number;
    status: string;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startTimestamp: number;
    endTimestamp: number;
    quorum: string;
    calldatas: string[];
    values: string[];
    targets: string[];
    proposalType: number | null;
}
export interface OnchainVote {
    voterAddress: string;
    transactionHash: string;
    proposalId: string;
    support?: string | null;
    votingPower: string;
    reason?: string | null;
    timestamp: number;
    proposalTitle?: string | null;
}
export interface HistoricalVotingPower {
    transactionHash: string;
    daoId: string;
    accountId: string;
    votingPower: string;
    delta: string;
    timestamp: string;
    logIndex: number;
    delegation: {
        from: string;
        value: string;
        to: string;
        previousDelegate: string | null;
    } | null;
    transfer: {
        value: string;
        from: string;
        to: string;
    } | null;
}
export interface ProposalNonVoter {
    voter: string;
    votingPower: string;
    lastVoteTimestamp: number;
    votingPowerVariation: string;
}
export interface OffchainProposalItem {
    id: string;
    spaceId: string;
    author: string;
    title: string;
    body: string;
    discussion: string;
    type: string;
    start: number;
    end: number;
    state: string;
    created: number;
    updated: number;
    link: string;
    flagged: boolean;
    scores: number[];
    choices: string[];
    network: string;
    snapshot: number | null;
    strategies: Array<{
        name: string;
        network: string;
        params: Record<string, unknown>;
    }>;
}
export interface OffchainVoteItem {
    voter: string;
    proposalId: string;
    choice: string | number | Record<string, number>;
    vp: number | null;
    reason: string;
    created: number;
    proposalTitle: string | null;
}
export interface GetDaOsQuery {
    items: Dao[];
    totalCount: number;
}
export interface GetProposalByIdQuery extends OnchainProposal {
}
export interface GetProposalByIdQueryVariables {
    id: string;
}
export interface ListProposalsQuery {
    items: OnchainProposal[];
    totalCount: number;
}
export interface ListProposalsQueryVariables {
    skip?: number;
    limit?: number;
    orderDirection?: OrderDirection;
    status?: string | string[];
    fromDate?: number;
    fromEndDate?: number;
    includeOptimisticProposals?: boolean | null;
}
export interface ListVotesQuery {
    items: OnchainVote[];
    totalCount: number;
}
export interface ListVotesQueryVariables {
    voterAddressIn?: string[];
    fromDate?: number;
    toDate?: number;
    limit?: number;
    skip?: number;
    orderBy?: QueryInput_Votes_OrderBy;
    orderDirection?: OrderDirection;
    support?: string;
}
export interface ListHistoricalVotingPowerQuery {
    items: HistoricalVotingPower[];
    totalCount: number;
}
export interface ListHistoricalVotingPowerQueryVariables {
    limit?: number;
    skip?: number;
    orderBy?: QueryInput_HistoricalVotingPower_OrderBy;
    orderDirection?: OrderDirection;
    fromDate?: number;
    toDate?: number;
    fromValue?: string;
    toValue?: string;
    address?: string;
}
export interface ListOffchainProposalsQueryVariables {
    skip?: number;
    limit?: number;
    orderDirection?: OrderDirection;
    status?: string | string[];
    fromDate?: number;
    endDate?: number;
}
export interface ListOffchainVotesQueryVariables {
    fromDate?: number;
    toDate?: number;
    limit?: number;
    skip?: number;
    orderBy?: QueryInput_VotesOffchain_OrderBy;
    orderDirection?: OrderDirection;
    voterAddresses?: string[];
}
