"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRelevance = exports.FeedEventType = void 0;
exports.processProposals = processProposals;
exports.processVotingPowerHistory = processVotingPowerHistory;
var FeedEventType;
(function (FeedEventType) {
    FeedEventType["Delegation"] = "DELEGATION";
    FeedEventType["Proposal"] = "PROPOSAL";
    FeedEventType["ProposalExtended"] = "PROPOSAL_EXTENDED";
    FeedEventType["Transfer"] = "TRANSFER";
    FeedEventType["Vote"] = "VOTE";
})(FeedEventType || (exports.FeedEventType = FeedEventType = {}));
var FeedRelevance;
(function (FeedRelevance) {
    FeedRelevance["High"] = "HIGH";
    FeedRelevance["Low"] = "LOW";
    FeedRelevance["Medium"] = "MEDIUM";
})(FeedRelevance || (exports.FeedRelevance = FeedRelevance = {}));
function processProposals(data, daoId) {
    const items = data.proposals?.items ?? [];
    return items.filter((p) => p !== null).map(p => ({
        ...p,
        daoId,
    }));
}
function processVotingPowerHistory(data, daoId, chainId) {
    const items = data.historicalVotingPower?.items ?? [];
    return items
        .filter(item => item.accountId)
        .map(item => ({
        ...item,
        daoId,
        changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
        sourceAccountId: item.transfer?.from || item.delegation?.from || '',
        targetAccountId: item.accountId,
        previousDelegate: item.delegation?.previousDelegate || null,
        newDelegate: item.delegation?.to || null,
        ...(chainId !== undefined && { chainId }),
    }));
}
