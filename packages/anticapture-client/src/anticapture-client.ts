import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { z } from 'zod';
import pRetry, { type Options } from 'p-retry';
import { RETRY_OPTIONS, isRetryableError } from './retry-config';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListVotingPowerHistorysQueryVariables
} from './gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument, ListVotingPowerHistorysDocument } from './gql/graphql';
import { SafeDaosResponseSchema, SafeProposalByIdResponseSchema, SafeProposalsResponseSchema, SafeVotingPowerHistoryResponseSchema, processProposals, processVotingPowerHistory, ProcessedVotingPowerHistory } from './schemas';

type ProposalItems = ListProposalsQuery['proposalsOnchains']['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;
  private readonly retryOptions: Options;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
    this.retryOptions = RETRY_OPTIONS;
  }

  private async query<TResult, TVariables, TSchema extends z.ZodSchema<any>>(
    document: TypedDocumentNode<TResult, TVariables>,
    schema: TSchema,
    variables?: TVariables,
    daoId?: string
  ): Promise<z.infer<TSchema>> {
    return pRetry(async () => {
      const headers = this.buildHeaders(daoId);
      
      const response = await this.httpClient.post('', {
        query: print(document),
        variables,
      }, { headers });

      return schema.parse(response.data.data);
    }, {
      ...this.retryOptions,
      shouldRetry: isRetryableError
    });
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
    const validated = await this.query(GetDaOsDocument, SafeDaosResponseSchema, undefined, undefined);
    return validated.daos.items.map((dao) => ({
      id: dao.id,
      // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
      blockTime: 12, // Temporary hardcoded value - Ethereum block time
      votingDelay: dao.votingDelay || '0'
    }));
  }


  /**
   * Fetches a single proposal by ID with full type safety
   */
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null> {
    const variables: GetProposalByIdQueryVariables = {
      id: id
    };

    const validated = await this.query(GetProposalByIdDocument, SafeProposalByIdResponseSchema, variables, undefined);
    return validated.proposalsOnchain;
  }


  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems> {
    if (!daoId && !variables?.where?.daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: ProposalItems = [];

      for (const dao of allDAOs) {
        const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, dao.id);
        allProposals.push(...processProposals(validated, dao.id));
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
        const validated = await this.query(ListVotingPowerHistorysDocument, SafeVotingPowerHistoryResponseSchema, variables, dao.id);
        return processVotingPowerHistory(validated, dao.id);
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