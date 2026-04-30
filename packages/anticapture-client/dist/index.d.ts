import type { OnchainProposal } from '@anticapture/client';
export { AnticaptureClient } from './anticapture-client';
export type { AnticaptureClientConfig, VoteWithDaoId, OffchainVoteWithDaoId } from './anticapture-client';
export { FeedEventType, FeedRelevance } from './schemas';
export type { ProcessedVotingPowerHistory, OffchainProposalItem, OffchainVoteItem } from './schemas';
export declare enum OrderDirection {
    Asc = "asc",
    Desc = "desc"
}
export declare enum QueryInput_Proposals_Status_Items {
    Active = "ACTIVE",
    Canceled = "CANCELED",
    Defeated = "DEFEATED",
    Executed = "EXECUTED",
    Expired = "EXPIRED",
    NoQuorum = "NO_QUORUM",
    Pending = "PENDING",
    PendingExecution = "PENDING_EXECUTION",
    Queued = "QUEUED",
    Succeeded = "SUCCEEDED"
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
export type ListProposalsQueryVariables = {
    skip?: number;
    limit?: number;
    orderDirection?: OrderDirection;
    status?: QueryInput_Proposals_Status_Items | QueryInput_Proposals_Status_Items[];
    fromDate?: number;
    fromEndDate?: number;
    includeOptimisticProposals?: boolean;
};
export type ListHistoricalVotingPowerQueryVariables = {
    limit?: number;
    skip?: number;
    orderBy?: QueryInput_HistoricalVotingPower_OrderBy;
    orderDirection?: OrderDirection;
    fromDate?: number;
};
export type GetProposalByIdQuery = {
    proposal?: (OnchainProposal & {
        __typename?: 'OnchainProposal';
    }) | {
        __typename?: 'ErrorResponse';
    } | null;
};
