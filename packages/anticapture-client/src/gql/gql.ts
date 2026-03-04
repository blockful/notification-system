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
    "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n      chainId\n    }\n  }\n}": typeof types.GetDaOsDocument,
    "query ProposalNonVoters($id: String!, $addresses: JSON) {\n  proposalNonVoters(id: $id, addresses: $addresses) {\n    items {\n      voter\n    }\n  }\n}": typeof types.ProposalNonVotersDocument,
    "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n    txHash\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: JSON, $fromDate: Float, $fromEndDate: Float, $includeOptimisticProposals: queryInput_proposals_includeOptimisticProposals) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n    fromEndDate: $fromEndDate\n    includeOptimisticProposals: $includeOptimisticProposals\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      title\n      description\n      startBlock\n      endBlock\n      endTimestamp\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n      txHash\n    }\n    totalCount\n  }\n}": typeof types.GetProposalByIdDocument,
    "query GetEventRelevanceThreshold($relevance: queryInput_getEventRelevanceThreshold_relevance!, $type: queryInput_getEventRelevanceThreshold_type!) {\n  getEventRelevanceThreshold(relevance: $relevance, type: $type) {\n    threshold\n  }\n}": typeof types.GetEventRelevanceThresholdDocument,
    "query ListVotes($voterAddressIn: JSON, $fromDate: Float, $toDate: Float, $limit: Float, $skip: NonNegativeInt, $orderBy: queryInput_votes_orderBy, $orderDirection: queryInput_votes_orderDirection, $support: Float) {\n  votes(\n    voterAddressIn: $voterAddressIn\n    fromDate: $fromDate\n    toDate: $toDate\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    support: $support\n  ) {\n    items {\n      transactionHash\n      proposalId\n      voterAddress\n      support\n      votingPower\n      timestamp\n      reason\n      proposalTitle\n    }\n    totalCount\n  }\n}": typeof types.ListVotesDocument,
    "query ListHistoricalVotingPower($limit: PositiveInt, $skip: NonNegativeInt, $orderBy: queryInput_historicalVotingPower_orderBy, $orderDirection: queryInput_historicalVotingPower_orderDirection, $fromDate: String, $address: String) {\n  historicalVotingPower(\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    fromDate: $fromDate\n    address: $address\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      logIndex\n      delegation {\n        from\n        to\n        value\n        previousDelegate\n      }\n      transfer {\n        from\n        to\n        value\n      }\n    }\n    totalCount\n  }\n}": typeof types.ListHistoricalVotingPowerDocument,
};
const documents: Documents = {
    "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n      chainId\n    }\n  }\n}": types.GetDaOsDocument,
    "query ProposalNonVoters($id: String!, $addresses: JSON) {\n  proposalNonVoters(id: $id, addresses: $addresses) {\n    items {\n      voter\n    }\n  }\n}": types.ProposalNonVotersDocument,
    "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n    txHash\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: JSON, $fromDate: Float, $fromEndDate: Float, $includeOptimisticProposals: queryInput_proposals_includeOptimisticProposals) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n    fromEndDate: $fromEndDate\n    includeOptimisticProposals: $includeOptimisticProposals\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      title\n      description\n      startBlock\n      endBlock\n      endTimestamp\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n      txHash\n    }\n    totalCount\n  }\n}": types.GetProposalByIdDocument,
    "query GetEventRelevanceThreshold($relevance: queryInput_getEventRelevanceThreshold_relevance!, $type: queryInput_getEventRelevanceThreshold_type!) {\n  getEventRelevanceThreshold(relevance: $relevance, type: $type) {\n    threshold\n  }\n}": types.GetEventRelevanceThresholdDocument,
    "query ListVotes($voterAddressIn: JSON, $fromDate: Float, $toDate: Float, $limit: Float, $skip: NonNegativeInt, $orderBy: queryInput_votes_orderBy, $orderDirection: queryInput_votes_orderDirection, $support: Float) {\n  votes(\n    voterAddressIn: $voterAddressIn\n    fromDate: $fromDate\n    toDate: $toDate\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    support: $support\n  ) {\n    items {\n      transactionHash\n      proposalId\n      voterAddress\n      support\n      votingPower\n      timestamp\n      reason\n      proposalTitle\n    }\n    totalCount\n  }\n}": types.ListVotesDocument,
    "query ListHistoricalVotingPower($limit: PositiveInt, $skip: NonNegativeInt, $orderBy: queryInput_historicalVotingPower_orderBy, $orderDirection: queryInput_historicalVotingPower_orderDirection, $fromDate: String, $address: String) {\n  historicalVotingPower(\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    fromDate: $fromDate\n    address: $address\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      logIndex\n      delegation {\n        from\n        to\n        value\n        previousDelegate\n      }\n      transfer {\n        from\n        to\n        value\n      }\n    }\n    totalCount\n  }\n}": types.ListHistoricalVotingPowerDocument,
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
export function graphql(source: "query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n      chainId\n    }\n  }\n}"): (typeof documents)["query GetDAOs {\n  daos {\n    items {\n      id\n      votingDelay\n      chainId\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ProposalNonVoters($id: String!, $addresses: JSON) {\n  proposalNonVoters(id: $id, addresses: $addresses) {\n    items {\n      voter\n    }\n  }\n}"): (typeof documents)["query ProposalNonVoters($id: String!, $addresses: JSON) {\n  proposalNonVoters(id: $id, addresses: $addresses) {\n    items {\n      voter\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n    txHash\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: JSON, $fromDate: Float, $fromEndDate: Float, $includeOptimisticProposals: queryInput_proposals_includeOptimisticProposals) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n    fromEndDate: $fromEndDate\n    includeOptimisticProposals: $includeOptimisticProposals\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      title\n      description\n      startBlock\n      endBlock\n      endTimestamp\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n      txHash\n    }\n    totalCount\n  }\n}"): (typeof documents)["query GetProposalById($id: String!) {\n  proposal(id: $id) {\n    id\n    daoId\n    proposerAccountId\n    title\n    description\n    startBlock\n    endBlock\n    endTimestamp\n    timestamp\n    status\n    forVotes\n    againstVotes\n    abstainVotes\n    txHash\n  }\n}\n\nquery ListProposals($skip: NonNegativeInt, $limit: PositiveInt, $orderDirection: queryInput_proposals_orderDirection, $status: JSON, $fromDate: Float, $fromEndDate: Float, $includeOptimisticProposals: queryInput_proposals_includeOptimisticProposals) {\n  proposals(\n    skip: $skip\n    limit: $limit\n    orderDirection: $orderDirection\n    status: $status\n    fromDate: $fromDate\n    fromEndDate: $fromEndDate\n    includeOptimisticProposals: $includeOptimisticProposals\n  ) {\n    items {\n      id\n      daoId\n      proposerAccountId\n      title\n      description\n      startBlock\n      endBlock\n      endTimestamp\n      timestamp\n      status\n      forVotes\n      againstVotes\n      abstainVotes\n      txHash\n    }\n    totalCount\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetEventRelevanceThreshold($relevance: queryInput_getEventRelevanceThreshold_relevance!, $type: queryInput_getEventRelevanceThreshold_type!) {\n  getEventRelevanceThreshold(relevance: $relevance, type: $type) {\n    threshold\n  }\n}"): (typeof documents)["query GetEventRelevanceThreshold($relevance: queryInput_getEventRelevanceThreshold_relevance!, $type: queryInput_getEventRelevanceThreshold_type!) {\n  getEventRelevanceThreshold(relevance: $relevance, type: $type) {\n    threshold\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListVotes($voterAddressIn: JSON, $fromDate: Float, $toDate: Float, $limit: Float, $skip: NonNegativeInt, $orderBy: queryInput_votes_orderBy, $orderDirection: queryInput_votes_orderDirection, $support: Float) {\n  votes(\n    voterAddressIn: $voterAddressIn\n    fromDate: $fromDate\n    toDate: $toDate\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    support: $support\n  ) {\n    items {\n      transactionHash\n      proposalId\n      voterAddress\n      support\n      votingPower\n      timestamp\n      reason\n      proposalTitle\n    }\n    totalCount\n  }\n}"): (typeof documents)["query ListVotes($voterAddressIn: JSON, $fromDate: Float, $toDate: Float, $limit: Float, $skip: NonNegativeInt, $orderBy: queryInput_votes_orderBy, $orderDirection: queryInput_votes_orderDirection, $support: Float) {\n  votes(\n    voterAddressIn: $voterAddressIn\n    fromDate: $fromDate\n    toDate: $toDate\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    support: $support\n  ) {\n    items {\n      transactionHash\n      proposalId\n      voterAddress\n      support\n      votingPower\n      timestamp\n      reason\n      proposalTitle\n    }\n    totalCount\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListHistoricalVotingPower($limit: PositiveInt, $skip: NonNegativeInt, $orderBy: queryInput_historicalVotingPower_orderBy, $orderDirection: queryInput_historicalVotingPower_orderDirection, $fromDate: String, $address: String) {\n  historicalVotingPower(\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    fromDate: $fromDate\n    address: $address\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      logIndex\n      delegation {\n        from\n        to\n        value\n        previousDelegate\n      }\n      transfer {\n        from\n        to\n        value\n      }\n    }\n    totalCount\n  }\n}"): (typeof documents)["query ListHistoricalVotingPower($limit: PositiveInt, $skip: NonNegativeInt, $orderBy: queryInput_historicalVotingPower_orderBy, $orderDirection: queryInput_historicalVotingPower_orderDirection, $fromDate: String, $address: String) {\n  historicalVotingPower(\n    limit: $limit\n    skip: $skip\n    orderBy: $orderBy\n    orderDirection: $orderDirection\n    fromDate: $fromDate\n    address: $address\n  ) {\n    items {\n      accountId\n      timestamp\n      votingPower\n      delta\n      daoId\n      transactionHash\n      logIndex\n      delegation {\n        from\n        to\n        value\n        previousDelegate\n      }\n      transfer {\n        from\n        to\n        value\n      }\n    }\n    totalCount\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;