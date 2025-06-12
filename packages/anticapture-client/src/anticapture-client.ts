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
  private readonly endpoint: string;

  constructor(endpoint: string, httpClient: AxiosInstance) {
    this.endpoint = endpoint;
    this.httpClient = httpClient;
  }

  private async query<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const response = await this.httpClient.post(this.endpoint, {
      query: print(document),
      variables,
    });

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
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchains']['items'][0] | null> {
    const variables: GetProposalByIdQueryVariables = {
      where: {
        id: id
      }
    };

    const response = await this.query(GetProposalByIdDocument, variables);
    const proposals = response.proposalsOnchains.items;
    
    return proposals.length > 0 ? proposals[0] : null;
  }

  /**
   * Lists proposals with optional filtering and pagination with full type safety
   */
  async listProposals(variables?: ListProposalsQueryVariables): Promise<ListProposalsQuery['proposalsOnchains']['items']> {
    const response = await this.query(ListProposalsDocument, variables);
    return response.proposalsOnchains.items.filter(item => item !== null);
  }
}