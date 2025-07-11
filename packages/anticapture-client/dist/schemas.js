"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeVotingPowerHistoryResponseSchema = exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.SafeDaosResponseSchema = void 0;
exports.processProposals = processProposals;
exports.processVotingPowerHistory = processVotingPowerHistory;
const zod_1 = require("zod");
// Schema with built-in transformation and fallbacks
exports.SafeDaosResponseSchema = zod_1.z.object({
    daos: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string() }))
    }).nullable()
}).transform((data, ctx) => {
    if (!data.daos || !data.daos.items) {
        console.warn('DaosResponse has null daos or items:', data);
        return { daos: { items: [] } };
    }
    return { daos: { items: data.daos.items } };
}).catch(() => {
    console.warn('DaosResponse validation failed completely');
    return { daos: { items: [] } };
});
exports.SafeProposalsResponseSchema = zod_1.z.object({
    proposalsOnchains: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.any())
    }).nullable()
}).transform((data, ctx) => {
    if (!data.proposalsOnchains || !data.proposalsOnchains.items) {
        console.warn('ProposalsResponse has null proposalsOnchains or items:', data);
        return { proposalsOnchains: { items: [] } };
    }
    return { proposalsOnchains: { items: data.proposalsOnchains.items } };
}).catch(() => {
    console.warn('ProposalsResponse validation failed completely');
    return { proposalsOnchains: { items: [] } };
});
exports.SafeProposalByIdResponseSchema = zod_1.z.object({
    proposalsOnchain: zod_1.z.any().nullable()
}).catch(() => {
    console.warn('ProposalByIdResponse validation failed completely');
    return { proposalsOnchain: null };
});
// Define schema for delegation data (based on actual API response)
const DelegationSchema = zod_1.z.object({
    delegatorAccountId: zod_1.z.string(),
    delegatedValue: zod_1.z.string()
}).nullable();
// Define schema for transfer data (based on actual API response)
const TransferSchema = zod_1.z.object({
    amount: zod_1.z.string(),
    fromAccountId: zod_1.z.string(),
    toAccountId: zod_1.z.string()
}).nullable();
// Define schema for voting power history item (based on actual API response)
const VotingPowerHistoryItemSchema = zod_1.z.object({
    accountId: zod_1.z.string(),
    timestamp: zod_1.z.string(),
    votingPower: zod_1.z.string(),
    delta: zod_1.z.string().nullable(),
    daoId: zod_1.z.string(),
    transactionHash: zod_1.z.string(),
    delegation: DelegationSchema,
    transfer: TransferSchema
});
exports.SafeVotingPowerHistoryResponseSchema = zod_1.z.object({
    votingPowerHistorys: zod_1.z.object({
        items: zod_1.z.array(VotingPowerHistoryItemSchema)
    }).nullable()
}).transform((data, ctx) => {
    if (!data.votingPowerHistorys || !data.votingPowerHistorys.items) {
        console.warn('VotingPowerHistoryResponse has null votingPowerHistorys or items:', data);
        return { votingPowerHistorys: { items: [] } };
    }
    return { votingPowerHistorys: { items: data.votingPowerHistorys.items } };
}).catch(() => {
    console.warn('VotingPowerHistoryResponse validation failed completely');
    return { votingPowerHistorys: { items: [] } };
});
// Helper function to process validated proposals
function processProposals(validated, daoId) {
    return validated.proposalsOnchains.items.reduce((acc, proposal) => {
        if (proposal !== null) {
            acc.push({
                ...proposal,
                daoId: daoId
            });
        }
        return acc;
    }, []);
}
// Helper function to process validated voting power history
function processVotingPowerHistory(validated, daoId) {
    return validated.votingPowerHistorys.items.map((item) => {
        const processed = {
            ...item,
            daoId: daoId,
            delta: item.delta || '0',
            changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
            sourceAccountId: item.transfer?.fromAccountId || item.delegation?.delegatorAccountId || null,
            targetAccountId: item.accountId
        };
        return processed;
    });
}
