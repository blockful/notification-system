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
    "query GetDAOs {\n  daos {\n    items {\n      id\n    }\n  }\n}": types.GetDaOsDocument,
    "query GetProposalById($id: String!) {\n  proposalsOnchain(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    targets\n    values\n    signatures\n    calldatas\n    startBlock\n    endBlock\n    description\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}\n\nquery ListProposals($where: proposalsOnchainFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  proposalsOnchains(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      targets\n      values\n      signatures\n      calldatas\n      startBlock\n      endBlock\n      description\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n    }\n  }\n}": types.GetProposalByIdDocument,
    "query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegatedValue\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}": types.ListVotingPowerHistorysDocument,
};
function graphql(source) {
    return documents[source] ?? {};
}
