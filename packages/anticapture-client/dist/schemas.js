"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeProposalNonVotersResponseSchema = exports.SafeVotesResponseSchema = exports.SafeHistoricalVotingPowerResponseSchema = exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.SafeDaosResponseSchema = void 0;
exports.processProposals = processProposals;
exports.processVotingPowerHistory = processVotingPowerHistory;
const zod_1 = require("zod");
// Schema with built-in transformation and fallbacks
exports.SafeDaosResponseSchema = zod_1.z.object({
    daos: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            votingDelay: zod_1.z.string().optional(),
            chainId: zod_1.z.number()
        }))
    }).nullable()
}).transform((data) => {
    if (!data.daos || !data.daos.items) {
        console.warn('DaosResponse has null daos or items:', data);
        return { daos: { items: [] } };
    }
    return { daos: { items: data.daos.items } };
});
exports.SafeProposalsResponseSchema = zod_1.z.object({
    proposals: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.any()),
        totalCount: zod_1.z.number()
    }).nullable()
}).transform((data) => {
    if (!data.proposals) {
        console.warn('ProposalsResponse has null proposals:', data);
        return { proposals: { items: [], totalCount: 0 } };
    }
    return { proposals: data.proposals };
});
exports.SafeProposalByIdResponseSchema = zod_1.z.object({
    proposal: zod_1.z.any().nullable()
});
// Define schema for historical voting power item
const HistoricalVotingPowerItemSchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    votingPower: zod_1.z.string(),
    delta: zod_1.z.string(),
    daoId: zod_1.z.string(),
    transactionHash: zod_1.z.string(),
    delegation: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
        value: zod_1.z.string(),
        previousDelegate: zod_1.z.string().nullable()
    }).nullable(),
    transfer: zod_1.z.object({
        from: zod_1.z.string(),
        to: zod_1.z.string(),
        value: zod_1.z.string()
    }).nullable()
});
exports.SafeHistoricalVotingPowerResponseSchema = zod_1.z.object({
    historicalVotingPower: zod_1.z.object({
        items: zod_1.z.array(HistoricalVotingPowerItemSchema.nullable()),
        totalCount: zod_1.z.number()
    }).nullable()
}).transform((data) => {
    // Ensure we always have a valid structure
    const items = data.historicalVotingPower?.items?.filter((item) => item !== null) || [];
    return {
        historicalVotingPower: {
            items,
            totalCount: data.historicalVotingPower?.totalCount || 0
        }
    };
});
exports.SafeVotesResponseSchema = zod_1.z.object({
    votes: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            transactionHash: zod_1.z.string(),
            proposalId: zod_1.z.string(),
            voterAddress: zod_1.z.string(),
            support: zod_1.z.number(),
            votingPower: zod_1.z.string(),
            timestamp: zod_1.z.number(),
            reason: zod_1.z.string().nullable().optional(),
            proposalTitle: zod_1.z.string(),
        }).nullable()),
        totalCount: zod_1.z.number(),
    }).nullable(),
}).transform((data) => {
    if (!data.votes) {
        console.warn('VotesResponse has no votes:', data);
        return { votes: { items: [], totalCount: 0 } };
    }
    return {
        votes: {
            ...data.votes,
            items: data.votes.items.filter((item) => item !== null)
        }
    };
});
exports.SafeProposalNonVotersResponseSchema = zod_1.z.object({
    proposalNonVoters: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            voter: zod_1.z.string()
        }).nullable()),
        totalCount: zod_1.z.number().optional()
    }).nullable()
}).transform((data) => {
    if (!data.proposalNonVoters) {
        console.warn('ProposalNonVotersResponse has null proposalNonVoters:', data);
        return { proposalNonVoters: { items: [], totalCount: 0 } };
    }
    return {
        proposalNonVoters: {
            ...data.proposalNonVoters,
            items: data.proposalNonVoters.items.filter((item) => item !== null)
        }
    };
});
// Internal helper function to process validated proposals
function processProposals(validated, daoId) {
    return validated.proposals.items.reduce((acc, proposal) => {
        if (proposal !== null) {
            acc.push({
                ...proposal,
                daoId: daoId
            });
        }
        return acc;
    }, []);
}
// Internal helper function to process validated voting power history
function processVotingPowerHistory(validated, daoId, chainId) {
    return validated.historicalVotingPower.items
        .filter(item => item.accountId)
        .map((item) => {
        const processed = {
            ...item,
            accountId: item.accountId,
            daoId: daoId,
            delta: item.delta,
            changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
            sourceAccountId: item.transfer?.from || item.delegation?.from || '',
            targetAccountId: item.accountId,
            previousDelegate: item.delegation?.previousDelegate || null,
            newDelegate: item.delegation?.to || null,
            ...(chainId !== undefined && { chainId })
        };
        return processed;
    });
}
