"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noopAnticaptureClient = void 0;
exports.makeAnticaptureClient = makeAnticaptureClient;
exports.noopAnticaptureClient = {
    getDAOs: async () => [],
    getProposalById: async () => null,
    listProposals: async () => [],
    listVotingPowerHistory: async () => [],
    listVotes: async () => [],
    getProposalNonVoters: async () => [],
    getOffchainProposalNonVoters: async () => [],
    listRecentVotesFromAllDaos: async () => [],
    getEventThreshold: async () => null,
    listOffchainProposals: async () => [],
    listOffchainVotes: async () => [],
    listRecentOffchainVotesFromAllDaos: async () => [],
};
function makeAnticaptureClient(overrides = {}) {
    return { ...exports.noopAnticaptureClient, ...overrides };
}
