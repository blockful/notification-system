"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.SafeDaosResponseSchema = void 0;
exports.processProposals = processProposals;
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
