import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { z } from 'zod';
import { getAddress, isAddress } from 'viem';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListVotingPowerHistorysQueryVariables,
  ListVotesOnchainsQuery,
  ListVotesOnchainsQueryVariables
} from './gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument, ListVotingPowerHistorysDocument, ListVotesOnchainsDocument } from './gql/graphql';
import { SafeDaosResponseSchema, SafeProposalByIdResponseSchema, SafeProposalsResponseSchema, SafeVotingPowerHistoryResponseSchema, SafeVotesOnchainsResponseSchema, processProposals, processVotingPowerHistory, ProcessedVotingPowerHistory } from './schemas';

type ProposalItems = NonNullable<ListProposalsQuery['proposals']>['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];
type VotesOnchain = NonNullable<ListVotesOnchainsQuery['votesOnchains']['items'][0]>;

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  /**
   * Recursively normalizes Ethereum addresses to EIP-55 checksum format
   * Detects addresses by their format using viem's isAddress validation
   * @param obj - Any value to normalize (primitives, objects, arrays, nested structures)
   * @returns The normalized value with checksummed addresses
   */
  private normalizeAddresses(obj: any): any {
    if (obj == null) return obj;

    if (typeof obj === 'string') {
      try {
        return isAddress(obj) ? getAddress(obj) : obj;
      } catch {
        return obj;
      }
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeAddresses(item));
    }

    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.normalizeAddresses(v)])
      );
    }

    return obj;
  }

  private async query<TResult, TVariables, TSchema extends z.ZodSchema<any>>(
    document: TypedDocumentNode<TResult, TVariables>,
    schema: TSchema,
    variables?: TVariables,
    daoId?: string
  ): Promise<z.infer<TSchema>> {
    const headers = this.buildHeaders(daoId);

    // Normalize addresses in variables to EIP-55 checksum format
    const normalizedVariables = variables ? this.normalizeAddresses(variables) : variables;

    const response = await this.httpClient.post('', {
      query: print(document),
      variables: normalizedVariables,
    }, { headers });

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
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
  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string; chainId: number }>> {
    try {
      const validated = await this.query(GetDaOsDocument, SafeDaosResponseSchema, undefined, undefined);
      return validated.daos.items.map((dao) => ({
        id: dao.id,
        // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
        blockTime: 12, // Temporary hardcoded value - Ethereum block time
        votingDelay: dao.votingDelay || '0',
        chainId: dao.chainId
      }));
    } catch (error) {
      console.warn('Returning empty DAO list due to API error: ', error instanceof Error ? error.message : error);
      return [];
    }
  }


  /**
   * Fetches a single proposal by ID with full type safety
   */
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposal'] | null> {
    try {
      const variables: GetProposalByIdQueryVariables = {
        id: id
      };

      const validated = await this.query(GetProposalByIdDocument, SafeProposalByIdResponseSchema, variables, undefined);
      return validated.proposal;
    } catch (error) {
      console.warn(`Returning null for proposal ${id} due to API error`, error instanceof Error ? error.message : error);
      return null;
    }
  }


  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: ProposalItems = [];

      for (const dao of allDAOs) {
        try {
          const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, dao.id);
          const processed = processProposals(validated, dao.id);
          if (processed && processed.length > 0) {
            allProposals.push(...processed);
          }
        } catch (error) {
          console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
        }
      }

      return allProposals;
    }

    try {
      const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, daoId);
      return processProposals(validated, daoId!) || [];
    } catch (error) {
      console.warn(`Error querying proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
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
        try {
          const validated = await this.query(ListVotingPowerHistorysDocument, SafeVotingPowerHistoryResponseSchema, variables, dao.id);
          return processVotingPowerHistory(validated, dao.id, dao.chainId);
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

    try {
      const validated = await this.query(ListVotingPowerHistorysDocument, SafeVotingPowerHistoryResponseSchema, variables, daoId);
      return processVotingPowerHistory(validated, daoId!);
    } catch (error) {
      console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  /**
   * Fetches votes for specific proposals and voter addresses
   * @param variables Query variables including daoId, proposalId_in, voterAccountId_in
   * @returns List of votes matching the criteria
   */
  async listVotesOnchains(variables: ListVotesOnchainsQueryVariables): Promise<VotesOnchain[]> {
    try {
      const validated = await this.query(
        ListVotesOnchainsDocument,
        SafeVotesOnchainsResponseSchema,
        variables,
        variables.daoId
      );
      return validated.votesOnchains.items;
    } catch (error) {
      console.warn('Error fetching votes', error);
      return [];
    }
  }

  /**
   * List recent votes from all DAOs since a given timestamp
   * @param timestampGt Fetch votes with timestamp greater than this value
   * @param limit Maximum number of votes to fetch per DAO (default: 100)
   * @returns Array of votes from all DAOs
   */
  async listRecentVotesFromAllDaos(timestampGt: string, limit: number = 100): Promise<VotesOnchain[]> {
    // First, fetch all DAOs
    const daos = await this.getDAOs();

    // Fetch votes from each DAO in parallel
    const votePromises = daos.map(dao =>
      this.listVotesOnchains({
        daoId: dao.id,
        timestamp_gt: timestampGt,
        limit,
        orderBy: 'timestamp',
        orderDirection: 'asc'
      }).catch(error => {
        console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error);
        return []; // Return empty array for failed DAOs
      })
    );

    const voteArrays = await Promise.all(votePromises);

    // Flatten and sort by timestamp
    const allVotes = voteArrays.flat();
    allVotes.sort((a: VotesOnchain, b: VotesOnchain) => {
      const timestampA = parseInt(a.timestamp || '0');
      const timestampB = parseInt(b.timestamp || '0');
      return timestampA - timestampB;
    });

    return allVotes;
  }
}