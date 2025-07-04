"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeProposalByIdResponseSchema = exports.SafeProposalsResponseSchema = exports.SafeDaosResponseSchema = void 0;
exports.validateDaosResponse = validateDaosResponse;
exports.validateProposalsResponse = validateProposalsResponse;
exports.validateProposalByIdResponse = validateProposalByIdResponse;
exports.validateAndProcessProposals = validateAndProcessProposals;
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
function validateDaosResponse(data) {
    return exports.SafeDaosResponseSchema.parse(data);
}
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
function validateProposalsResponse(data) {
    return exports.SafeProposalsResponseSchema.parse(data);
}
function validateProposalByIdResponse(data) {
    return exports.SafeProposalByIdResponseSchema.parse(data);
}
// Utility function that validates AND processes proposals in one go
function validateAndProcessProposals(data, daoId) {
    const validated = validateProposalsResponse(data);
    // Process the items directly here, eliminating the need for a separate method
    const processedItems = validated.proposalsOnchains.items.reduce((acc, proposal) => {
        if (proposal !== null) {
            acc.push({
                ...proposal,
                daoId: proposal.daoId || daoId
            });
        }
        return acc;
    }, []);
    return processedItems;
}
