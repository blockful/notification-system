"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphql = graphql;
/* eslint-disable */
const types = __importStar(require("./graphql"));
const documents = {
    "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n      chainId\n    }\n  }\n}": types.GetDaOsDocument,
    "query ProposalNonVoters($id: String!, $addresses: JSON) {\n  proposalNonVoters(id: $id, addresses: $addresses) {\n    items {\n      voter\n    }\n  }\n}": types.ProposalNonVotersDocument,
    "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n    txHash\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: JSON, $fromDate: Float, $fromEndDate: Float, $includeOptimisticProposals: queryInput_proposals_includeOptimisticProposals) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n    fromEndDate: $fromEndDate\n    includeOptimisticProposals: $includeOptimisticProposals\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      title\n      description\n      startBlock\n      endBlock\n      endTimestamp\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n      txHash\n    }\n    totalCount\n  }\n}": types.GetProposalByIdDocument,
    "query GetEventRelevanceThreshold($relevance: queryInput_getEventRelevanceThreshold_relevance!, $type: queryInput_getEventRelevanceThreshold_type!) {\n  getEventRelevanceThreshold(relevance: $relevance, type: $type) {\n    threshold\n  }\n}": types.GetEventRelevanceThresholdDocument,
    "query ListVotes($voterAddressIn: JSON, $fromDate: Float, $toDate: Float, $limit: Float, $skip: NonNegativeInt, $orderBy: queryInput_votes_orderBy, $orderDirection: queryInput_votes_orderDirection, $support: Float) {\n  votes(\n    voterAddressIn: $voterAddressIn\n    fromDate: $fromDate\n    toDate: $toDate\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    support: $support\n  ) {\n    items {\n      transactionHash\n      proposalId\n      voterAddress\n      support\n      votingPower\n      timestamp\n      reason\n      proposalTitle\n    }\n    totalCount\n  }\n}": types.ListVotesDocument,
    "query ListHistoricalVotingPower($limit: PositiveInt, $skip: NonNegativeInt, $orderBy: queryInput_historicalVotingPower_orderBy, $orderDirection: queryInput_historicalVotingPower_orderDirection, $fromDate: String, $address: String) {\n  historicalVotingPower(\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    fromDate: $fromDate\n    address: $address\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      logIndex\n      delegation {\n        from\n        to\n        value\n        previousDelegate\n      }\n      transfer {\n        from\n        to\n        value\n      }\n    }\n    totalCount\n  }\n}": types.ListHistoricalVotingPowerDocument,
};
function graphql(source) {
    return documents[source] ?? {};
}
