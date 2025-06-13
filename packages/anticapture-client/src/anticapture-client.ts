import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type {
  GetDaOsQuery,
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables
} from './gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument } from './gql/graphql';

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  private async query<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    daoId?: string
  ): Promise<TResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Only add dao-id header if specified
    if (daoId) {
      headers["anticapture-dao-id"] = daoId;
    }

    const response = await this.httpClient.post('', {
      query: print(document),
      variables,
    }, { headers });

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  }
  

  /**
   * Fetches all DAOs from the anticapture GraphQL API with full type safety
   * @returns Array of DAO IDs
   */
  async getDAOs(): Promise<string[]> {
    const result = await this.query(GetDaOsDocument);
    return result.daos.items.map(dao => dao.id);
  }

  /**
   * Fetches a single proposal by ID with full type safety
   */
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null> {
    const variables: GetProposalByIdQueryVariables = {
      id: id
    };

    const response = await this.query(GetProposalByIdDocument, variables);
    return response.proposalsOnchain;
  }

  /**
   * Lists proposals with optional filtering and pagination with full type safety
   */
  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ListProposalsQuery['proposalsOnchains']['items']> {
    if (!daoId && !variables?.where?.daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: ListProposalsQuery['proposalsOnchains']['items'] = [];

      for (const currentDaoId of allDAOs) {
        const response = await this.query(ListProposalsDocument, variables, currentDaoId);
        allProposals.push(...response.proposalsOnchains.items.filter(item => item !== null));
      }

      return allProposals;
    }

    const response = await this.query(ListProposalsDocument, variables, daoId);
    return response.proposalsOnchains.items.filter(item => item !== null);
  }
}