/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n    }\n  }\n}": typeof types.GetDaOsDocument,
    "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: String, $fromDate: Float) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n  ) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}": typeof types.GetProposalByIdDocument,
    "query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegatedValue\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}": typeof types.ListVotingPowerHistorysDocument,
};
const documents: Documents = {
    "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n    }\n  }\n}": types.GetDaOsDocument,
    "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: String, $fromDate: Float) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n  ) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}": types.GetProposalByIdDocument,
    "query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegatedValue\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}": types.ListVotingPowerHistorysDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n    }\n  }\n}"): (typeof documents)["query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: String, $fromDate: Float) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n  ) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}"): (typeof documents)["query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: String, $fromDate: Float) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n  ) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegatedValue\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}"): (typeof documents)["query ListVotingPowerHistorys($where: votingPowerHistoryFilter, $limit: Int, $orderBy: String, $orderDirection: String) {\n  votingPowerHistorys(\n    where: $where\n    limit: $limit\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      delegation {\n        delegatorAccountId\n        delegatedValue\n      }\n      transfer {\n        amount\n        fromAccountId\n        toAccountId\n      }\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;