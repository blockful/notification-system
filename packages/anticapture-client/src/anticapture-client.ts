import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { z } from 'zod';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListVotingPowerHistorysQueryVariables
} from '../dist/gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument, ListVotingPowerHistorysDocument } from '../dist/gql/graphql';
import { SafeDaosResponseSchema, SafeProposalByIdResponseSchema, SafeProposalsResponseSchema, SafeVotingPowerHistoryResponseSchema, processProposals, processVotingPowerHistory, ProcessedVotingPowerHistory } from './schemas';

type ProposalItems = ListProposalsQuery['proposalsOnchains']['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  private async query<TResult, TVariables, TSchema extends z.ZodSchema<any>>(
    document: TypedDocumentNode<TResult, TVariables>,
    schema: TSchema,
    variables?: TVariables,
    daoId?: string
  ): Promise<z.infer<TSchema>> {
    const headers = this.buildHeaders(daoId);
    
    const response = await this.httpClient.post('', {
      query: print(document),
      variables,
    }, { headers });

    // Handle empty or undefined responses
    if (!response || !response.data) {
      throw new Error('No data received from GraphQL endpoint');
    }

    if (response.data.errors) {
      const errorDetail = response.data.errors[0];
      console.error(`GraphQL Error Details:`, {
        message: errorDetail?.message,
        path: errorDetail?.path,
        daoId: daoId || 'unknown'
      });
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return schema.parse(response.data.data);
  }

  private buildHeaders(daoId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (daoId) {
      headers["anticapture-dao-id"] = daoId;
    }

    return headers;
  }
  

  /**
   * Fetches all DAOs from the anticapture GraphQL API with full type safety
   * @returns Array of DAO objects with blockTime added
   */
  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string }>> {
    try {
      const validated = await this.query(GetDaOsDocument, SafeDaosResponseSchema, undefined, undefined);
      return validated.daos.items.map((dao) => ({
        id: dao.id,
        // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
        blockTime: 12, // Temporary hardcoded value - Ethereum block time
        votingDelay: dao.votingDelay || '0'
      }));
    } catch (error) {
      console.warn('Returning empty DAO list due to API error: ',  error instanceof Error ? error.message : error);
      return [];
    }
  }


  /**
   * Fetches a single proposal by ID with full type safety
   */
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null> {
    try {
      const variables: GetProposalByIdQueryVariables = {
        id: id
      };

      const validated = await this.query(GetProposalByIdDocument, SafeProposalByIdResponseSchema, variables, undefined);
      return validated.proposalsOnchain;
    } catch (error) {
      console.warn(`Returning null for proposal ${id} due to API error`, error instanceof Error ? error.message : error);
      return null;
    }
  }


  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems> {
    if (!daoId && !variables?.where?.daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: ProposalItems = [];

      for (const dao of allDAOs) {
        const variablesWithDao = {
          ...variables,
          where: {
            ...variables?.where,
            daoId: dao.id
          }
        };
        try {
          const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variablesWithDao, dao.id);
          allProposals.push(...processProposals(validated, dao.id));
        } catch (error) {
          console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
        }
      }

      return allProposals;
    }

    const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, daoId);
    return processProposals(validated, daoId!);
  }

  /**
   * Lists voting power history with full type safety
   * @param variables - Query variables for filtering and pagination
   * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
   * @returns Array of voting power history items
   */
  async listVotingPowerHistory(variables?: ListVotingPowerHistorysQueryVariables, daoId?: string): Promise<VotingPowerHistoryItems> {
    if (!daoId && !variables?.where?.daoId) {
      const allDAOs = await this.getDAOs();
      const queryPromises = allDAOs.map(async (dao) => {
        const variablesWithDao = {
          ...variables,
          where: {
            ...variables?.where,
            daoId: dao.id
          }
        };
        try {
          const validated = await this.query(ListVotingPowerHistorysDocument, SafeVotingPowerHistoryResponseSchema, variablesWithDao, dao.id);
          return processVotingPowerHistory(validated, dao.id);
        } catch (error) {
          console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
          return [];
        }
      });

      const results = await Promise.all(queryPromises);
      return results.flat().sort((a: ProcessedVotingPowerHistory, b: ProcessedVotingPowerHistory) => 
        parseInt(a.timestamp) - parseInt(b.timestamp)
      );
    }

    const validated = await this.query(ListVotingPowerHistorysDocument, SafeVotingPowerHistoryResponseSchema, variables, daoId);
    return processVotingPowerHistory(validated, daoId!);
  }
}