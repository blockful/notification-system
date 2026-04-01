import { z } from 'zod';
import type { Dao, HistoricalVotingPower, OffchainProposalItem, OffchainVoteItem, OnchainProposal, OnchainVote, ProposalNonVoter } from './types';
export { FeedEventType, FeedRelevance } from './types';
export declare const DaoSchema: z.ZodObject<{
    id: z.ZodString;
    chainId: z.ZodNumber;
    quorum: z.ZodString;
    proposalThreshold: z.ZodString;
    votingDelay: z.ZodString;
    votingPeriod: z.ZodString;
    timelockDelay: z.ZodString;
    alreadySupportCalldataReview: z.ZodBoolean;
    supportOffchainData: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    chainId: number;
    quorum: string;
    proposalThreshold: string;
    votingDelay: string;
    votingPeriod: string;
    timelockDelay: string;
    alreadySupportCalldataReview: boolean;
    supportOffchainData: boolean;
}, {
    id: string;
    chainId: number;
    quorum: string;
    proposalThreshold: string;
    votingDelay: string;
    votingPeriod: string;
    timelockDelay: string;
    alreadySupportCalldataReview: boolean;
    supportOffchainData: boolean;
}>;
export declare const SafeDaosResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        chainId: z.ZodNumber;
        quorum: z.ZodString;
        proposalThreshold: z.ZodString;
        votingDelay: z.ZodString;
        votingPeriod: z.ZodString;
        timelockDelay: z.ZodString;
        alreadySupportCalldataReview: z.ZodBoolean;
        supportOffchainData: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        chainId: number;
        quorum: string;
        proposalThreshold: string;
        votingDelay: string;
        votingPeriod: string;
        timelockDelay: string;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }, {
        id: string;
        chainId: number;
        quorum: string;
        proposalThreshold: string;
        votingDelay: string;
        votingPeriod: string;
        timelockDelay: string;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        chainId: number;
        quorum: string;
        proposalThreshold: string;
        votingDelay: string;
        votingPeriod: string;
        timelockDelay: string;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }[];
    totalCount: number;
}, {
    items: {
        id: string;
        chainId: number;
        quorum: string;
        proposalThreshold: string;
        votingDelay: string;
        votingPeriod: string;
        timelockDelay: string;
        alreadySupportCalldataReview: boolean;
        supportOffchainData: boolean;
    }[];
    totalCount: number;
}>;
export declare const OnchainProposalSchema: z.ZodObject<{
    id: z.ZodString;
    daoId: z.ZodString;
    txHash: z.ZodString;
    proposerAccountId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    startBlock: z.ZodNumber;
    endBlock: z.ZodNumber;
    timestamp: z.ZodNumber;
    status: z.ZodString;
    forVotes: z.ZodString;
    againstVotes: z.ZodString;
    abstainVotes: z.ZodString;
    startTimestamp: z.ZodNumber;
    endTimestamp: z.ZodNumber;
    quorum: z.ZodString;
    calldatas: z.ZodArray<z.ZodString, "many">;
    values: z.ZodArray<z.ZodString, "many">;
    targets: z.ZodArray<z.ZodString, "many">;
    proposalType: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    id: string;
    quorum: string;
    values: string[];
    status: string;
    daoId: string;
    txHash: string;
    proposerAccountId: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startTimestamp: number;
    endTimestamp: number;
    calldatas: string[];
    targets: string[];
    proposalType: number | null;
}, {
    timestamp: number;
    id: string;
    quorum: string;
    values: string[];
    status: string;
    daoId: string;
    txHash: string;
    proposerAccountId: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startTimestamp: number;
    endTimestamp: number;
    calldatas: string[];
    targets: string[];
    proposalType: number | null;
}>;
export declare const SafeProposalsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        daoId: z.ZodString;
        txHash: z.ZodString;
        proposerAccountId: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        startBlock: z.ZodNumber;
        endBlock: z.ZodNumber;
        timestamp: z.ZodNumber;
        status: z.ZodString;
        forVotes: z.ZodString;
        againstVotes: z.ZodString;
        abstainVotes: z.ZodString;
        startTimestamp: z.ZodNumber;
        endTimestamp: z.ZodNumber;
        quorum: z.ZodString;
        calldatas: z.ZodArray<z.ZodString, "many">;
        values: z.ZodArray<z.ZodString, "many">;
        targets: z.ZodArray<z.ZodString, "many">;
        proposalType: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        id: string;
        quorum: string;
        values: string[];
        status: string;
        daoId: string;
        txHash: string;
        proposerAccountId: string;
        title: string;
        description: string;
        startBlock: number;
        endBlock: number;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        startTimestamp: number;
        endTimestamp: number;
        calldatas: string[];
        targets: string[];
        proposalType: number | null;
    }, {
        timestamp: number;
        id: string;
        quorum: string;
        values: string[];
        status: string;
        daoId: string;
        txHash: string;
        proposerAccountId: string;
        title: string;
        description: string;
        startBlock: number;
        endBlock: number;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        startTimestamp: number;
        endTimestamp: number;
        calldatas: string[];
        targets: string[];
        proposalType: number | null;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        timestamp: number;
        id: string;
        quorum: string;
        values: string[];
        status: string;
        daoId: string;
        txHash: string;
        proposerAccountId: string;
        title: string;
        description: string;
        startBlock: number;
        endBlock: number;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        startTimestamp: number;
        endTimestamp: number;
        calldatas: string[];
        targets: string[];
        proposalType: number | null;
    }[];
    totalCount: number;
}, {
    items: {
        timestamp: number;
        id: string;
        quorum: string;
        values: string[];
        status: string;
        daoId: string;
        txHash: string;
        proposerAccountId: string;
        title: string;
        description: string;
        startBlock: number;
        endBlock: number;
        forVotes: string;
        againstVotes: string;
        abstainVotes: string;
        startTimestamp: number;
        endTimestamp: number;
        calldatas: string[];
        targets: string[];
        proposalType: number | null;
    }[];
    totalCount: number;
}>;
export declare const SafeProposalByIdResponseSchema: z.ZodObject<{
    id: z.ZodString;
    daoId: z.ZodString;
    txHash: z.ZodString;
    proposerAccountId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    startBlock: z.ZodNumber;
    endBlock: z.ZodNumber;
    timestamp: z.ZodNumber;
    status: z.ZodString;
    forVotes: z.ZodString;
    againstVotes: z.ZodString;
    abstainVotes: z.ZodString;
    startTimestamp: z.ZodNumber;
    endTimestamp: z.ZodNumber;
    quorum: z.ZodString;
    calldatas: z.ZodArray<z.ZodString, "many">;
    values: z.ZodArray<z.ZodString, "many">;
    targets: z.ZodArray<z.ZodString, "many">;
    proposalType: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    id: string;
    quorum: string;
    values: string[];
    status: string;
    daoId: string;
    txHash: string;
    proposerAccountId: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startTimestamp: number;
    endTimestamp: number;
    calldatas: string[];
    targets: string[];
    proposalType: number | null;
}, {
    timestamp: number;
    id: string;
    quorum: string;
    values: string[];
    status: string;
    daoId: string;
    txHash: string;
    proposerAccountId: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    startTimestamp: number;
    endTimestamp: number;
    calldatas: string[];
    targets: string[];
    proposalType: number | null;
}>;
declare const HistoricalVotingPowerItemSchema: z.ZodObject<{
    accountId: z.ZodString;
    timestamp: z.ZodString;
    votingPower: z.ZodString;
    delta: z.ZodString;
    daoId: z.ZodString;
    transactionHash: z.ZodString;
    logIndex: z.ZodNumber;
    delegation: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
        previousDelegate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    }, {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    }>>;
    transfer: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        from: string;
        to: string;
    }, {
        value: string;
        from: string;
        to: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    delta: string;
    timestamp: string;
    votingPower: string;
    daoId: string;
    accountId: string;
    transactionHash: string;
    logIndex: number;
    delegation: {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    } | null;
    transfer: {
        value: string;
        from: string;
        to: string;
    } | null;
}, {
    delta: string;
    timestamp: string;
    votingPower: string;
    daoId: string;
    accountId: string;
    transactionHash: string;
    logIndex: number;
    delegation: {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    } | null;
    transfer: {
        value: string;
        from: string;
        to: string;
    } | null;
}>;
export declare const SafeHistoricalVotingPowerResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        timestamp: z.ZodString;
        votingPower: z.ZodString;
        delta: z.ZodString;
        daoId: z.ZodString;
        transactionHash: z.ZodString;
        logIndex: z.ZodNumber;
        delegation: z.ZodNullable<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            value: z.ZodString;
            previousDelegate: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        }, {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        }>>;
        transfer: z.ZodNullable<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            value: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            value: string;
            from: string;
            to: string;
        }, {
            value: string;
            from: string;
            to: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        delta: string;
        timestamp: string;
        votingPower: string;
        daoId: string;
        accountId: string;
        transactionHash: string;
        logIndex: number;
        delegation: {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        } | null;
        transfer: {
            value: string;
            from: string;
            to: string;
        } | null;
    }, {
        delta: string;
        timestamp: string;
        votingPower: string;
        daoId: string;
        accountId: string;
        transactionHash: string;
        logIndex: number;
        delegation: {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        } | null;
        transfer: {
            value: string;
            from: string;
            to: string;
        } | null;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        delta: string;
        timestamp: string;
        votingPower: string;
        daoId: string;
        accountId: string;
        transactionHash: string;
        logIndex: number;
        delegation: {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        } | null;
        transfer: {
            value: string;
            from: string;
            to: string;
        } | null;
    }[];
    totalCount: number;
}, {
    items: {
        delta: string;
        timestamp: string;
        votingPower: string;
        daoId: string;
        accountId: string;
        transactionHash: string;
        logIndex: number;
        delegation: {
            value: string;
            from: string;
            to: string;
            previousDelegate: string | null;
        } | null;
        transfer: {
            value: string;
            from: string;
            to: string;
        } | null;
    }[];
    totalCount: number;
}>;
declare const VoteItemSchema: z.ZodObject<{
    transactionHash: z.ZodString;
    proposalId: z.ZodString;
    voterAddress: z.ZodString;
    support: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>>>;
    votingPower: z.ZodString;
    timestamp: z.ZodNumber;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    proposalTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    votingPower: string;
    transactionHash: string;
    proposalId: string;
    voterAddress: string;
    support?: string | null | undefined;
    reason?: string | null | undefined;
    proposalTitle?: string | null | undefined;
}, {
    timestamp: number;
    votingPower: string;
    transactionHash: string;
    proposalId: string;
    voterAddress: string;
    support?: string | number | null | undefined;
    reason?: string | null | undefined;
    proposalTitle?: string | null | undefined;
}>;
export declare const SafeVotesResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        transactionHash: z.ZodString;
        proposalId: z.ZodString;
        voterAddress: z.ZodString;
        support: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>>>;
        votingPower: z.ZodString;
        timestamp: z.ZodNumber;
        reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        proposalTitle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        timestamp: number;
        votingPower: string;
        transactionHash: string;
        proposalId: string;
        voterAddress: string;
        support?: string | null | undefined;
        reason?: string | null | undefined;
        proposalTitle?: string | null | undefined;
    }, {
        timestamp: number;
        votingPower: string;
        transactionHash: string;
        proposalId: string;
        voterAddress: string;
        support?: string | number | null | undefined;
        reason?: string | null | undefined;
        proposalTitle?: string | null | undefined;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        timestamp: number;
        votingPower: string;
        transactionHash: string;
        proposalId: string;
        voterAddress: string;
        support?: string | null | undefined;
        reason?: string | null | undefined;
        proposalTitle?: string | null | undefined;
    }[];
    totalCount: number;
}, {
    items: {
        timestamp: number;
        votingPower: string;
        transactionHash: string;
        proposalId: string;
        voterAddress: string;
        support?: string | number | null | undefined;
        reason?: string | null | undefined;
        proposalTitle?: string | null | undefined;
    }[];
    totalCount: number;
}>;
declare const ProposalNonVoterSchema: z.ZodObject<{
    voter: z.ZodString;
    votingPower: z.ZodString;
    lastVoteTimestamp: z.ZodNumber;
    votingPowerVariation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    votingPower: string;
    voter: string;
    lastVoteTimestamp: number;
    votingPowerVariation: string;
}, {
    votingPower: string;
    voter: string;
    lastVoteTimestamp: number;
    votingPowerVariation: string;
}>;
export declare const SafeProposalNonVotersResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        voter: z.ZodString;
        votingPower: z.ZodString;
        lastVoteTimestamp: z.ZodNumber;
        votingPowerVariation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        votingPower: string;
        voter: string;
        lastVoteTimestamp: number;
        votingPowerVariation: string;
    }, {
        votingPower: string;
        voter: string;
        lastVoteTimestamp: number;
        votingPowerVariation: string;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        votingPower: string;
        voter: string;
        lastVoteTimestamp: number;
        votingPowerVariation: string;
    }[];
    totalCount: number;
}, {
    items: {
        votingPower: string;
        voter: string;
        lastVoteTimestamp: number;
        votingPowerVariation: string;
    }[];
    totalCount: number;
}>;
export declare const EventThresholdResponseSchema: z.ZodObject<{
    threshold: z.ZodString;
}, "strip", z.ZodTypeAny, {
    threshold: string;
}, {
    threshold: string;
}>;
export declare const OffchainProposalItemSchema: z.ZodObject<{
    id: z.ZodString;
    spaceId: z.ZodString;
    author: z.ZodString;
    title: z.ZodString;
    body: z.ZodString;
    discussion: z.ZodString;
    type: z.ZodString;
    start: z.ZodNumber;
    end: z.ZodNumber;
    state: z.ZodString;
    created: z.ZodNumber;
    updated: z.ZodNumber;
    link: z.ZodString;
    flagged: z.ZodBoolean;
    scores: z.ZodArray<z.ZodNumber, "many">;
    choices: z.ZodArray<z.ZodString, "many">;
    network: z.ZodString;
    snapshot: z.ZodNullable<z.ZodNumber>;
    strategies: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        network: z.ZodString;
        params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        params: Record<string, unknown>;
        network: string;
        name: string;
    }, {
        params: Record<string, unknown>;
        network: string;
        name: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    title: string;
    spaceId: string;
    author: string;
    body: string;
    discussion: string;
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
    strategies: {
        params: Record<string, unknown>;
        network: string;
        name: string;
    }[];
}, {
    id: string;
    type: string;
    title: string;
    spaceId: string;
    author: string;
    body: string;
    discussion: string;
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
    strategies: {
        params: Record<string, unknown>;
        network: string;
        name: string;
    }[];
}>;
export declare const SafeOffchainProposalsResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        spaceId: z.ZodString;
        author: z.ZodString;
        title: z.ZodString;
        body: z.ZodString;
        discussion: z.ZodString;
        type: z.ZodString;
        start: z.ZodNumber;
        end: z.ZodNumber;
        state: z.ZodString;
        created: z.ZodNumber;
        updated: z.ZodNumber;
        link: z.ZodString;
        flagged: z.ZodBoolean;
        scores: z.ZodArray<z.ZodNumber, "many">;
        choices: z.ZodArray<z.ZodString, "many">;
        network: z.ZodString;
        snapshot: z.ZodNullable<z.ZodNumber>;
        strategies: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            network: z.ZodString;
            params: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }, {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        title: string;
        spaceId: string;
        author: string;
        body: string;
        discussion: string;
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
        strategies: {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }[];
    }, {
        id: string;
        type: string;
        title: string;
        spaceId: string;
        author: string;
        body: string;
        discussion: string;
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
        strategies: {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }[];
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        type: string;
        title: string;
        spaceId: string;
        author: string;
        body: string;
        discussion: string;
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
        strategies: {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }[];
    }[];
    totalCount: number;
}, {
    items: {
        id: string;
        type: string;
        title: string;
        spaceId: string;
        author: string;
        body: string;
        discussion: string;
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
        strategies: {
            params: Record<string, unknown>;
            network: string;
            name: string;
        }[];
    }[];
    totalCount: number;
}>;
export declare const OffchainVoteItemSchema: z.ZodObject<{
    voter: z.ZodString;
    choice: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodRecord<z.ZodString, z.ZodNumber>]>;
    created: z.ZodNumber;
    proposalId: z.ZodString;
    proposalTitle: z.ZodNullable<z.ZodString>;
    reason: z.ZodString;
    vp: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    proposalId: string;
    reason: string;
    proposalTitle: string | null;
    voter: string;
    created: number;
    choice: string | number | Record<string, number>;
    vp: number | null;
}, {
    proposalId: string;
    reason: string;
    proposalTitle: string | null;
    voter: string;
    created: number;
    choice: string | number | Record<string, number>;
    vp: number | null;
}>;
export declare const SafeOffchainVotesResponseSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        voter: z.ZodString;
        choice: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodRecord<z.ZodString, z.ZodNumber>]>;
        created: z.ZodNumber;
        proposalId: z.ZodString;
        proposalTitle: z.ZodNullable<z.ZodString>;
        reason: z.ZodString;
        vp: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        proposalId: string;
        reason: string;
        proposalTitle: string | null;
        voter: string;
        created: number;
        choice: string | number | Record<string, number>;
        vp: number | null;
    }, {
        proposalId: string;
        reason: string;
        proposalTitle: string | null;
        voter: string;
        created: number;
        choice: string | number | Record<string, number>;
        vp: number | null;
    }>, "many">;
    totalCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: {
        proposalId: string;
        reason: string;
        proposalTitle: string | null;
        voter: string;
        created: number;
        choice: string | number | Record<string, number>;
        vp: number | null;
    }[];
    totalCount: number;
}, {
    items: {
        proposalId: string;
        reason: string;
        proposalTitle: string | null;
        voter: string;
        created: number;
        choice: string | number | Record<string, number>;
        vp: number | null;
    }[];
    totalCount: number;
}>;
export type ProcessedVotingPowerHistory = z.infer<typeof HistoricalVotingPowerItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
    previousDelegate: string | null;
    newDelegate: string | null;
    chainId?: number;
};
export type DaoResponseItem = z.infer<typeof DaoSchema>;
export type VoteItem = z.infer<typeof VoteItemSchema>;
export type ProposalNonVoterItem = z.infer<typeof ProposalNonVoterSchema>;
export type OffchainProposalResponseItem = z.infer<typeof OffchainProposalItemSchema>;
export type OffchainVoteResponseItem = z.infer<typeof OffchainVoteItemSchema>;
export declare function normalizeDao(dao: DaoResponseItem): Dao;
export declare function normalizeProposal(proposal: z.infer<typeof OnchainProposalSchema>): OnchainProposal;
export declare function normalizeVote(vote: VoteItem): OnchainVote;
export declare function normalizeNonVoter(voter: ProposalNonVoterItem): ProposalNonVoter;
export declare function normalizeOffchainProposal(proposal: OffchainProposalResponseItem): OffchainProposalItem;
export declare function normalizeOffchainVote(vote: OffchainVoteResponseItem): OffchainVoteItem;
export declare function processVotingPowerHistory(items: HistoricalVotingPower[], daoId: string, chainId?: number): ProcessedVotingPowerHistory[];
