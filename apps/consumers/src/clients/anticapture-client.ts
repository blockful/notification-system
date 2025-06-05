/**
 * Anticapture GraphQL API Client
 * Handles communication with the anticapture GraphQL endpoint using Apollo Client Core
 * Focused on DAO-related queries for the Consumer service
 */

import { ApolloClient, InMemoryCache, gql, NormalizedCacheObject } from '@apollo/client/core';
import { DaosResponse } from '../interfaces/anticapture.interface';

const GET_DAOS = gql`
  query GetDAOs {
    daos {
      items {
        id
      }
    }
  }
`;

export class AnticaptureClient {
  private client: ApolloClient<NormalizedCacheObject>;

  constructor(apiUrl: string) {
    this.client = new ApolloClient({
      uri: apiUrl,
      cache: new InMemoryCache(),
    });
  }

  /**
   * Fetches all DAOs from the anticapture GraphQL API
   * @returns Array of DAO IDs
   */
  async getDAOs(): Promise<string[]> {
    const result = await this.client.query<DaosResponse>({query: GET_DAOS});
    return result.data.daos.items.map(dao => dao.id);
  }

  /**
   * Closes the Apollo Client (cleanup)
   */
  public stop(): void {
    this.client.stop();
  }
} 