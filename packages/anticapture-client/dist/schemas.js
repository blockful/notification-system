"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeOffchainVotesResponseSchema = exports.OffchainVoteItemSchema = exports.SafeOffchainProposalsResponseSchema = exports.OffchainProposalItemSchema = exports.EventThresholdResponseSchema = exports.SafeProposalNonVotersResponseSchema = exports.SafeVotesResponseSchema = exports.SafeHistoricalVotingPowerResponseSchema = exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.OnchainProposalSchema = exports.SafeDaosResponseSchema = exports.DaoSchema = exports.FeedRelevance = exports.FeedEventType = void 0;
exports.normalizeDao = normalizeDao;
exports.normalizeProposal = normalizeProposal;
exports.normalizeVote = normalizeVote;
exports.normalizeNonVoter = normalizeNonVoter;
exports.normalizeOffchainProposal = normalizeOffchainProposal;
exports.normalizeOffchainVote = normalizeOffchainVote;
exports.processVotingPowerHistory = processVotingPowerHistory;
const zod_1 = require("zod");
const dao_id_1 = require("./dao-id");
var types_1 = require("./types");
Object.defineProperty(exports, "FeedEventType", { enumerable: true, get: function () { return types_1.FeedEventType; } });
Object.defineProperty(exports, "FeedRelevance", { enumerable: true, get: function () { return types_1.FeedRelevance; } });
exports.DaoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    chainId: zod_1.z.number(),
    quorum: zod_1.z.string(),
    proposalThreshold: zod_1.z.string(),
    votingDelay: zod_1.z.string(),
    votingPeriod: zod_1.z.string(),
    timelockDelay: zod_1.z.string(),
    alreadySupportCalldataReview: zod_1.z.boolean(),
    supportOffchainData: zod_1.z.boolean(),
});
exports.SafeDaosResponseSchema = zod_1.z.object({
    items: zod_1.z.array(exports.DaoSchema),
    totalCount: zod_1.z.number(),
});
exports.OnchainProposalSchema = zod_1.z.object({
    id: zod_1.z.string(),
    daoId: zod_1.z.string(),
    txHash: zod_1.z.string(),
    proposerAccountId: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    startBlock: zod_1.z.number(),
    endBlock: zod_1.z.number(),
    timestamp: zod_1.z.number(),
    status: zod_1.z.string(),
    forVotes: zod_1.z.string(),
    againstVotes: zod_1.z.string(),
    abstainVotes: zod_1.z.string(),
    startTimestamp: zod_1.z.number(),
    endTimestamp: zod_1.z.number(),
    quorum: zod_1.z.string(),
    calldatas: zod_1.z.array(zod_1.z.string()),
    values: zod_1.z.array(zod_1.z.string()),
    targets: zod_1.z.array(zod_1.z.string()),
    proposalType: zod_1.z.number().nullable(),
});
exports.SafeProposalsResponseSchema = zod_1.z.object({
    items: zod_1.z.array(exports.OnchainProposalSchema),
    totalCount: zod_1.z.number(),
});
exports.SafeProposalByIdResponseSchema = exports.OnchainProposalSchema;
const HistoricalVotingPowerItemSchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    votingPower: zod_1.z.string(),
    delta: zod_1.z.string(),
    daoId: zod_1.z.string(),
    transactionHash: zod_1.z.string(),
    logIndex: zod_1.z.number(),
    delegation: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
        value: zod_1.z.string(),
        previousDelegate: zod_1.z.string().nullable(),
    }).nullable(),
    transfer: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
        value: zod_1.z.string(),
    }).nullable(),
});
exports.SafeHistoricalVotingPowerResponseSchema = zod_1.z.object({
    items: zod_1.z.array(HistoricalVotingPowerItemSchema),
    totalCount: zod_1.z.number(),
});
const VoteItemSchema = zod_1.z.object({
    transactionHash: zod_1.z.string(),
    proposalId: zod_1.z.string(),
    voterAddress: zod_1.z.string(),
    support: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(String).nullable().optional(),
    votingPower: zod_1.z.string(),
    timestamp: zod_1.z.number(),
    reason: zod_1.z.string().nullable().optional(),
    proposalTitle: zod_1.z.string().nullable().optional(),
});
exports.SafeVotesResponseSchema = zod_1.z.object({
    items: zod_1.z.array(VoteItemSchema),
    totalCount: zod_1.z.number(),
});
const ProposalNonVoterSchema = zod_1.z.object({
    voter: zod_1.z.string(),
    votingPower: zod_1.z.string(),
    lastVoteTimestamp: zod_1.z.number(),
    votingPowerVariation: zod_1.z.string(),
});
exports.SafeProposalNonVotersResponseSchema = zod_1.z.object({
    items: zod_1.z.array(ProposalNonVoterSchema),
    totalCount: zod_1.z.number(),
});
exports.EventThresholdResponseSchema = zod_1.z.object({
    threshold: zod_1.z.string(),
});
exports.OffchainProposalItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    spaceId: zod_1.z.string(),
    author: zod_1.z.string(),
    title: zod_1.z.string(),
    body: zod_1.z.string(),
    discussion: zod_1.z.string(),
    type: zod_1.z.string(),
    start: zod_1.z.number(),
    end: zod_1.z.number(),
    state: zod_1.z.string(),
    created: zod_1.z.number(),
    updated: zod_1.z.number(),
    link: zod_1.z.string(),
    flagged: zod_1.z.boolean(),
    scores: zod_1.z.array(zod_1.z.number()),
    choices: zod_1.z.array(zod_1.z.string()),
    network: zod_1.z.string(),
    snapshot: zod_1.z.number().nullable(),
    strategies: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        network: zod_1.z.string(),
        params: zod_1.z.record(zod_1.z.unknown()),
    })),
});
exports.SafeOffchainProposalsResponseSchema = zod_1.z.object({
    items: zod_1.z.array(exports.OffchainProposalItemSchema),
    totalCount: zod_1.z.number(),
});
exports.OffchainVoteItemSchema = zod_1.z.object({
    voter: zod_1.z.string(),
    choice: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.record(zod_1.z.number())]),
    created: zod_1.z.number(),
    proposalId: zod_1.z.string(),
    proposalTitle: zod_1.z.string().nullable(),
    reason: zod_1.z.string(),
    vp: zod_1.z.number().nullable(),
});
exports.SafeOffchainVotesResponseSchema = zod_1.z.object({
    items: zod_1.z.array(exports.OffchainVoteItemSchema),
    totalCount: zod_1.z.number(),
});
function normalizeDao(dao) {
    return {
        ...dao,
        id: (0, dao_id_1.toLegacyDaoId)(dao.id),
    };
}
function normalizeProposal(proposal) {
    return {
        ...proposal,
        daoId: (0, dao_id_1.toLegacyDaoId)(proposal.daoId),
    };
}
function normalizeVote(vote) {
    return vote;
}
function normalizeNonVoter(voter) {
    return voter;
}
function normalizeOffchainProposal(proposal) {
    return proposal;
}
function normalizeOffchainVote(vote) {
    return vote;
}
function processVotingPowerHistory(items, daoId, chainId) {
    return items
        .filter(item => item.accountId)
        .map(item => ({
        ...item,
        daoId: (0, dao_id_1.toLegacyDaoId)(daoId),
        changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
        sourceAccountId: item.transfer?.from || item.delegation?.from || '',
        targetAccountId: item.accountId,
        previousDelegate: item.delegation?.previousDelegate || null,
        newDelegate: item.delegation?.to || null,
        chainId,
    }));
}
