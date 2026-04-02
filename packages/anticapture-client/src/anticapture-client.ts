import { AxiosInstance } from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { z } from 'zod';
import { getAddress, isAddress } from 'viem';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables,
  ListHistoricalVotingPowerQueryVariables,
  ListVotesQueryVariables,
  ProposalNonVotersQueryVariables,
  ListOffchainProposalsQueryVariables,
  ListOffchainVotesQueryVariables,
} from './gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument, ListHistoricalVotingPowerDocument, ListVotesDocument, ProposalNonVotersDocument, GetEventRelevanceThresholdDocument, QueryInput_Votes_OrderBy, OrderDirection, QueryInput_VotesOffchain_OrderBy, ListOffchainProposalsDocument, ListOffchainVotesDocument, OffchainProposalNonVotersDocument } from './gql/graphql';
import type { OffchainProposalNonVotersQueryVariables } from './gql/graphql';
import {
  SafeDaosResponseSchema,
  SafeProposalByIdResponseSchema,
  SafeProposalsResponseSchema,
  SafeHistoricalVotingPowerResponseSchema,
  SafeVotesResponseSchema,
  SafeProposalNonVotersResponseSchema,
  SafeOffchainProposalsResponseSchema,
  SafeOffchainVotesResponseSchema,
  SafeOffchainProposalNonVotersResponseSchema,
  processProposals,
  processVotingPowerHistory,
  ProcessedVotingPowerHistory,
  EventThresholdResponseSchema,
  FeedEventType,
  FeedRelevance,
  OffchainProposalItem,
  OffchainVoteItem } from './schemas';
type ProposalItems = NonNullable<ListProposalsQuery['proposals']>['items'];
type VotingPowerHistoryItems = ProcessedVotingPowerHistory[];
type ProposalNonVoter = z.infer<typeof SafeProposalNonVotersResponseSchema>['proposalNonVoters']['items'][0];
type VoteItem = z.infer<typeof SafeVotesResponseSchema>['votes']['items'][0];
export type VoteWithDaoId = VoteItem & { daoId: string };
export type OffchainVoteWithDaoId = OffchainVoteItem & { daoId: string };

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance, maxRetries: number = 4, timeout: number = 15000) {
    this.httpClient = httpClient;
    this.httpClient.defaults.timeout = timeout;

    axiosRetry(this.httpClient, {
      retries: maxRetries,
      retryDelay: exponentialDelay, // 1s, 2s, 4s, 8s
      retryCondition: (error) => {
        return isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status !== undefined && error.response.status >= 500);
      },
      onRetry: (retryCount, error, requestConfig) => {
        console.warn(
          `[AnticaptureClient] Retry ${retryCount}/${maxRetries} for ${requestConfig.url || 'request'}: ${error.message}`
        );
      },
    });
  }

  /**
   * Recursively normalizes Ethereum addresses in an object/array structure
   * @param obj - Any value to process
   * @param transformer - Function to transform each detected address
   * @returns The processed value with transformed addresses
   */
  private normalizeAddressesInObject(obj: any, transformer: (address: string) => string): any {
    if (obj == null) return obj;

    if (typeof obj === 'string') {
      try {
        return isAddress(obj) ? transformer(obj) : obj;
      } catch {
        return obj;
      }
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeAddressesInObject(item, transformer));
    }

    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.normalizeAddressesInObject(v, transformer)])
      );
    }

    return obj;
  }

  /**
   * Converts addresses to EIP-55 checksum format (for API input - case-sensitive API)
   */
  private toChecksum(obj: any): any {
    return this.normalizeAddressesInObject(obj, (address) => getAddress(address));
  }

  /**
   * Converts addresses to lowercase (for our system - case-insensitive DB)
   */
  private toLowercase(obj: any): any {
    return this.normalizeAddressesInObject(obj, (address) => address.toLowerCase());
  }

  private async query<TResult, TVariables, TSchema extends z.ZodSchema<any>>(
    document: TypedDocumentNode<TResult, TVariables>,
    schema: TSchema,
    variables?: TVariables,
    daoId?: string
  ): Promise<z.infer<TSchema>> {
    const headers = this.buildHeaders(daoId);

    // INPUT: Convert addresses to checksum format for case-sensitive API
    const checksummedVariables = variables ? this.toChecksum(variables) : variables;

    const response = await this.httpClient.post('', {
      query: print(document),
      variables: checksummedVariables,
    }, { headers });

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }

    return schema.parse(this.toLowercase(response.data.data));
  }

  private buildHeaders(daoId?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-source': 'notification-system'
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
  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string; chainId: number; alreadySupportCalldataReview: boolean; supportOffchainData: boolean }>> {
    try {
      const validated = await this.query(GetDaOsDocument, SafeDaosResponseSchema, undefined, undefined);
      return validated.daos.items.map((dao) => ({
        id: dao.id,
        // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
        blockTime: 12, // Temporary hardcoded value - Ethereum block time
        votingDelay: dao.votingDelay || '0',
        chainId: dao.chainId,
        alreadySupportCalldataReview: dao.alreadySupportCalldataReview ?? false,
        supportOffchainData: dao.supportOffchainData ?? false
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

      // Sort globally by timestamp desc (most recent first)
      if (variables?.fromEndDate) {
        allProposals.sort((a, b) => (b?.endTimestamp ?? 0) - (a?.endTimestamp ?? 0));
      } else {
        allProposals.sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
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
   * Uses the new historicalVotingPower query which properly returns delegation and transfer data
   * @param variables - Query variables for filtering and pagination (fromDate, limit, skip, orderBy, orderDirection, accountId)
   * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
   * @returns Array of voting power history items
   */
  async listVotingPowerHistory(variables?: ListHistoricalVotingPowerQueryVariables, daoId?: string): Promise<VotingPowerHistoryItems> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const queryPromises = allDAOs.map(async (dao) => {
        try {
          const validated = await this.query(ListHistoricalVotingPowerDocument, SafeHistoricalVotingPowerResponseSchema, variables, dao.id);
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
      const validated = await this.query(ListHistoricalVotingPowerDocument, SafeHistoricalVotingPowerResponseSchema, variables, daoId);
      return processVotingPowerHistory(validated, daoId!);
    } catch (error) {
      console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  /**
   * Fetches votes for specific proposals and voter addresses
   * @param variables Query variables including daoId
   * @returns List of votes matching the criteria
   */
  async listVotes(daoId: string, variables?: ListVotesQueryVariables): Promise<VoteItem[]> {
    try {
      const validated = await this.query(
        ListVotesDocument,
        SafeVotesResponseSchema,
        variables,
        daoId
      );
      return validated.votes.items;
    } catch (error) {
      console.warn(`Error fetching votes for DAO ${daoId}:`, error);
      return [];
    }
  }

  /**
   * Fetches addresses that haven't voted on a specific proposal
   * Note: API already filters for addresses with votingPower > 0
   * @param proposalId The proposal ID to check
   * @param daoId The DAO ID for the header
   * @param addresses Optional array of addresses to filter by
   * @returns List of non-voters with their voting power details
   */
  async getProposalNonVoters(
    proposalId: string,
    daoId: string,
    addresses?: string[],
  ): Promise<ProposalNonVoter[]> {
    try {
      const variables: ProposalNonVotersQueryVariables = {
        id: proposalId,
        ...(addresses && { addresses: addresses }),
      };

      const validated = await this.query(
        ProposalNonVotersDocument,
        SafeProposalNonVotersResponseSchema,
        variables,
        daoId
      );

      return validated.proposalNonVoters.items;
    } catch (error) {
      console.warn(`Error fetching non-voters for proposal ${proposalId}:`, error);
      return [];
    }
  }

  /**
   * Fetches addresses that haven't voted on a specific offchain (Snapshot) proposal
   * @param proposalId The Snapshot proposal ID to check
   * @param addresses Optional array of addresses to filter by
   * @returns List of non-voters
   */
  async getOffchainProposalNonVoters(
    proposalId: string,
    addresses?: string[],
  ): Promise<{ voter: string; votingPower?: string }[]> {
    try {
      const variables: OffchainProposalNonVotersQueryVariables = {
        id: proposalId,
        ...(addresses && { addresses: addresses.join(',') }),
        orderDirection: 'desc',
      };

      const validated = await this.query(
        OffchainProposalNonVotersDocument,
        SafeOffchainProposalNonVotersResponseSchema,
        variables,
      );

      return validated.offchainProposalNonVoters.items;
    } catch (error) {
      console.warn(`Error fetching offchain non-voters for proposal ${proposalId}:`, error);
      return [];
    }
  }

  /**
   * List recent votes from all DAOs since a given timestamp
   * @param timestampGt Fetch votes with timestamp greater than this value (unix timestamp as string)
   * @param limit Maximum number of votes to fetch per DAO (default: 100)
   * @returns Array of votes from all DAOs with daoId included
   */
  async listRecentVotesFromAllDaos(timestampGt: string, limit: number = 100): Promise<VoteWithDaoId[]> {
    // First, fetch all DAOs
    const daos = await this.getDAOs();

    // Fetch votes from each DAO in parallel
    const votePromises = daos.map(async (dao) => {
      try {
        const votes = await this.listVotes(dao.id, {
          fromDate: parseInt(timestampGt),
          limit,
          orderBy: QueryInput_Votes_OrderBy.Timestamp,
          orderDirection: OrderDirection.Asc
        });
        // Add daoId to each vote
        return votes.map(vote => ({
          ...vote,
          daoId: dao.id
        }));
      } catch (error) {
        console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error);
        return []; // Return empty array for failed DAOs
      }
    });

    const voteArrays = await Promise.all(votePromises);

    // Flatten and sort by timestamp
    const allVotes = voteArrays.flat();
    allVotes.sort((a: VoteWithDaoId, b: VoteWithDaoId) => {
      return a.timestamp - b.timestamp;
    });

    return allVotes;
  }

  /**
   * Fetches the event relevance threshold for a given DAO, event type, and relevance level.
   * Used to filter out low-impact events (e.g., small delegation changes).
   * @returns Threshold as a numeric string, or null if unavailable (fail-open)
   */
  async getEventThreshold(
    daoId: string,
    type: FeedEventType,
    relevance: FeedRelevance
  ): Promise<string | null> {
    try {
      const validated = await this.query(
        GetEventRelevanceThresholdDocument,
        EventThresholdResponseSchema,
        { type, relevance },
        daoId
      );
      return validated.getEventRelevanceThreshold.threshold;
    } catch (error) {
      console.warn(
        `[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`,
        error instanceof Error ? error.message : error
      );
      return null;

    }
  };
  /*
   * Lists offchain (Snapshot) proposals from all DAOs or a specific DAO
   * @param variables Query variables (skip, limit, orderDirection, status, fromDate)
   * @param daoId Optional specific DAO ID. If not provided, queries all DAOs
   * @returns Array of offchain proposal items with daoId attached
   */
  async listOffchainProposals(
    variables?: ListOffchainProposalsQueryVariables,
    daoId?: string
  ): Promise<(OffchainProposalItem & { daoId: string })[]> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: (OffchainProposalItem & { daoId: string })[] = [];

      for (const dao of allDAOs) {
        if (!dao.supportOffchainData) {
          continue;
        }

        try {
          const validated = await this.query(ListOffchainProposalsDocument, SafeOffchainProposalsResponseSchema, variables, dao.id);
          const items = validated.offchainProposals.items.map(item => ({ ...item, daoId: dao.id }));
          if (items.length > 0) {
            allProposals.push(...items);
          }
        } catch (error) {
          console.warn(`Skipping offchain proposals for ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
        }
      }

      // Sort by created timestamp desc (most recent first)
      allProposals.sort((a, b) => b.created - a.created);
      return allProposals;
    }

    try {
      const validated = await this.query(ListOffchainProposalsDocument, SafeOffchainProposalsResponseSchema, variables, daoId);
      return validated.offchainProposals.items.map(item => ({ ...item, daoId }));
    } catch (error) {
      console.warn(`Error querying offchain proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  /**
   * Fetches offchain (Snapshot) votes for a specific DAO
   * @param daoId The DAO ID to query
   * @param variables Query variables for filtering and pagination
   * @returns Array of offchain vote items
   */
  async listOffchainVotes(daoId: string, variables?: ListOffchainVotesQueryVariables): Promise<OffchainVoteItem[]> {
    try {
      const validated = await this.query(
        ListOffchainVotesDocument,
        SafeOffchainVotesResponseSchema,
        variables,
        daoId
      );
      return validated.votesOffchain.items;
    } catch (error) {
      console.warn(`Error fetching offchain votes for DAO ${daoId}:`, error);
      return [];
    }
  }

  /**
   * Fetches recent offchain votes from all DAOs since a given timestamp
   * @param fromDate Fetch votes with created timestamp greater than this value (unix timestamp)
   * @param limit Maximum number of votes to fetch per DAO (default: 100)
   * @returns Array of offchain votes from all DAOs with daoId included
   */
  async listRecentOffchainVotesFromAllDaos(fromDate: number, limit: number = 100): Promise<OffchainVoteWithDaoId[]> {
    const daos = await this.getDAOs();

    const votePromises = daos
      .filter(dao => dao.supportOffchainData)
      .map(async (dao) => {
        try {
          const votes = await this.listOffchainVotes(dao.id, {
            fromDate,
            limit,
            orderBy: QueryInput_VotesOffchain_OrderBy.Timestamp,
            orderDirection: OrderDirection.Asc
          });
          return votes.map(vote => ({
            ...vote,
            daoId: dao.id
          }));
        } catch (error) {
          console.warn(`Failed to fetch offchain votes for DAO ${dao.id}:`, error);
          return [];
        }
      });

    const voteArrays = await Promise.all(votePromises);

    const allVotes = voteArrays.flat();
    allVotes.sort((a, b) => a.created - b.created);

    return allVotes;
  }
}