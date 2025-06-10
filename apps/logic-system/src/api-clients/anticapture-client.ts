import axios, { AxiosInstance } from 'axios';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables
} from '../gql/graphql';
import { GetProposalByIdDocument, ListProposalsDocument } from '../gql/graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

/**
 * GraphQL client for anticapture API that handles proposal queries
 */
export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;
  private readonly endpoint: string;

  constructor(endpoint: string, httpClient: AxiosInstance) {
    this.endpoint = endpoint;
    this.httpClient = httpClient;
  }

  /**
   * Executes a GraphQL query against the anticapture API with type safety
   */
  private async query<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const response = await this.httpClient.post(this.endpoint, {
      query: (document as any).loc?.source.body || document.toString(),
      variables,
    });

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
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