"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processProposals = processProposals;
exports.processVotingPowerHistory = processVotingPowerHistory;
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
