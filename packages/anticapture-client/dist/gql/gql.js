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
    "query ListVotesOnchains($daoId: String!, $proposalId_in: [String!], $voterAccountId_in: [String!], $timestamp_gt: BigInt, $timestamp_gte: BigInt, $timestamp_lt: BigInt, $timestamp_lte: BigInt, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votesOnchains(\n    where: {daoId: $daoId, proposalId_in: $proposalId_in, voterAccountId_in: $voterAccountId_in, timestamp_gt: $timestamp_gt, timestamp_gte: $timestamp_gte, timestamp_lt: $timestamp_lt, timestamp_lte: $timestamp_lte}\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      daoId\n      txHash\n      proposalId\n      voterAccountId\n      support\n      votingPower\n      timestamp\n      reason\n    }\n    totalCount\n  }\n}": types.ListVotesOnchainsDocument,
    "query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegateAccountId\n        delegatedValue\n        previousDelegate\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}": types.ListVotingPowerHistorysDocument,
};
function graphql(source) {
    return documents[source] ?? {};
}
