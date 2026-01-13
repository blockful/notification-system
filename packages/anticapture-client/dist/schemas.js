"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeProposalNonVotersResponseSchema = exports.SafeVotesOnchainsResponseSchema = exports.SafeVotingPowerHistoryResponseSchema = exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.SafeDaosResponseSchema = void 0;
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
// Define schema for voting power history item (based on actual API response)
// Handle real-world scenarios where API might return null values or missing fields
const VotingPowerHistoryItemSchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    votingPower: zod_1.z.string().nullable(),
    delta: zod_1.z.string().nullable(),
    daoId: zod_1.z.string().nullable().default(null),
    transactionHash: zod_1.z.string(),
    delegation: zod_1.z.object({
        delegatorAccountId: zod_1.z.string(),
        delegateAccountId: zod_1.z.string(),
        delegatedValue: zod_1.z.string(),
        previousDelegate: zod_1.z.string().nullable()
    }).nullable().default(null),
    transfer: zod_1.z.object({
        amount: zod_1.z.string().nullable(),
        fromAccountId: zod_1.z.string(),
        toAccountId: zod_1.z.string()
    }).nullable().default(null)
});
exports.SafeVotingPowerHistoryResponseSchema = zod_1.z.object({
    votingPowerHistorys: zod_1.z.object({
        items: zod_1.z.array(VotingPowerHistoryItemSchema)
    }).nullable()
}).transform((data) => {
    // Ensure we always have a valid structure
    return {
        votingPowerHistorys: data.votingPowerHistorys || { items: [] }
    };
});
exports.SafeVotesOnchainsResponseSchema = zod_1.z.object({
    votesOnchains: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            daoId: zod_1.z.string(),
            txHash: zod_1.z.string(),
            proposalId: zod_1.z.string(),
            voterAccountId: zod_1.z.string(),
            support: zod_1.z.string(),
            votingPower: zod_1.z.string(),
            timestamp: zod_1.z.string(),
            reason: zod_1.z.string().optional().nullable(),
            proposal: zod_1.z.object({
                description: zod_1.z.string()
            }).optional().nullable()
        })),
        totalCount: zod_1.z.number()
    })
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
    return validated.votingPowerHistorys.items
        .filter(item => item.accountId)
        .map((item) => {
        const processed = {
            ...item,
            accountId: item.accountId,
            daoId: daoId,
            delta: item.delta,
            changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
            sourceAccountId: item.transfer?.fromAccountId || item.delegation?.delegatorAccountId || '',
            targetAccountId: item.accountId,
            previousDelegate: item.delegation?.previousDelegate || null,
            newDelegate: item.delegation?.delegateAccountId || null,
            ...(chainId !== undefined && { chainId })
        };
        return processed;
    });
}
