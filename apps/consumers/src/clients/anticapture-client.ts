/**
 * Anticapture GraphQL API Client
 * Handles communication with the anticapture GraphQL endpoint using Axios
 * Focused on DAO-related queries for the Consumer service
 */

import { AxiosInstance } from 'axios';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { GetDaOsDocument } from '../gql/graphql';

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
   * Fetches all DAOs from the anticapture GraphQL API with full type safety
   * @returns Array of DAO IDs
   */
  async getDAOs(): Promise<string[]> {
    const result = await this.query(GetDaOsDocument);
    return result.daos.items.map(dao => dao.id);
  }
} 