import axios, { AxiosInstance } from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';
import { z } from 'zod';
import { getAddress, isAddress } from 'viem';
import { toApiDaoId, toLegacyDaoId } from './dao-id';
import type {
  Dao,
  FeedEventType,
  FeedRelevance,
  HistoricalVotingPower,
  ListHistoricalVotingPowerQueryVariables,
  ListOffchainProposalsQueryVariables,
  ListOffchainVotesQueryVariables,
  ListProposalsQueryVariables,
  ListVotesQueryVariables,
  OffchainProposalItem,
  OffchainVoteItem,
  OnchainProposal,
  OnchainVote,
  ProposalNonVoter,
} from './types';
import {
  OrderDirection,
  QueryInput_Votes_OrderBy,
  QueryInput_VotesOffchain_OrderBy,
} from './types';
import {
  EventThresholdResponseSchema,
  FeedEventType as FeedEventTypeEnum,
  FeedRelevance as FeedRelevanceEnum,
  normalizeDao,
  normalizeNonVoter,
  normalizeOffchainProposal,
  normalizeOffchainVote,
  normalizeProposal,
  normalizeVote,
  processVotingPowerHistory,
  ProcessedVotingPowerHistory,
  SafeDaosResponseSchema,
  SafeHistoricalVotingPowerResponseSchema,
  SafeOffchainProposalsResponseSchema,
  SafeOffchainVotesResponseSchema,
  SafeProposalByIdResponseSchema,
  SafeProposalNonVotersResponseSchema,
  SafeProposalsResponseSchema,
  SafeVotesResponseSchema,
} from './schemas';

export type VoteWithDaoId = OnchainVote & { daoId: string };
export type OffchainVoteWithDaoId = OffchainVoteItem & { daoId: string };

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance, maxRetries: number = 4, timeout: number = 15000) {
    this.httpClient = httpClient;
    this.httpClient.defaults.timeout = timeout;
    this.httpClient.defaults.baseURL = this.normalizeBaseUrl(this.httpClient.defaults.baseURL);

    axiosRetry(this.httpClient, {
      retries: maxRetries,
      retryDelay: exponentialDelay,
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

  private normalizeBaseUrl(baseURL?: string): string | undefined {
    if (!baseURL) return baseURL;
    return baseURL.replace(/\/graphql\/?$/, '');
  }

  private normalizeAddressesInObject(obj: unknown, transformer: (address: string) => string): unknown {
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
        Object.entries(obj).map(([key, value]) => [key, this.normalizeAddressesInObject(value, transformer)])
      );
    }

    return obj;
  }

  private toChecksum<T>(obj: T): T {
    return this.normalizeAddressesInObject(obj, (address) => getAddress(address)) as T;
  }

  private toLowercase<T>(obj: T): T {
    return this.normalizeAddressesInObject(obj, (address) => address.toLowerCase()) as T;
  }

  private serializeParams(params?: object): Record<string, unknown> | undefined {
    if (!params) return undefined;

    return Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
    );
  }

  private async request<TSchema extends z.ZodSchema>(
    path: string,
    schema: TSchema,
    params?: object
  ): Promise<z.infer<TSchema>> {
    const response = await this.httpClient.get(path, {
      headers: {
        Accept: 'application/json',
        'x-client-source': 'notification-system',
      },
      params: this.serializeParams(this.toChecksum(params)),
    });

    return schema.parse(this.toLowercase(response.data));
  }

  private buildDaoPath(daoId: string): string {
    return `/${encodeURIComponent(toApiDaoId(daoId))}`;
  }

  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string; chainId: number; alreadySupportCalldataReview: boolean; supportOffchainData: boolean }>> {
    try {
      const validated = await this.request('/daos', SafeDaosResponseSchema);
      return validated.items.map((dao) => {
        const normalized = normalizeDao(dao);
        return {
          id: normalized.id,
          blockTime: 12,
          votingDelay: normalized.votingDelay,
          chainId: normalized.chainId,
          alreadySupportCalldataReview: normalized.alreadySupportCalldataReview,
          supportOffchainData: normalized.supportOffchainData,
        };
      });
    } catch (error) {
      console.warn('Returning empty DAO list due to API error:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getProposalById(id: string): Promise<OnchainProposal | null> {
    const daos = await this.getDAOs();

    for (const dao of daos) {
      try {
        const proposal = await this.request(
          `${this.buildDaoPath(dao.id)}/proposals/${encodeURIComponent(id)}`,
          SafeProposalByIdResponseSchema
        );
        return normalizeProposal(proposal);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          continue;
        }

        console.warn(
          `Skipping proposal lookup for DAO ${dao.id} due to API error:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    return null;
  }

  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<OnchainProposal[]> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const results = await Promise.all(allDAOs.map(async (dao) => {
        try {
          const validated = await this.request(
            `${this.buildDaoPath(dao.id)}/proposals`,
            SafeProposalsResponseSchema,
            variables
          );
          return validated.items.map(normalizeProposal);
        } catch (error) {
          console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
          return [];
        }
      }));

      const allProposals = results.flat();
      if (variables?.fromEndDate) {
        allProposals.sort((a, b) => b.endTimestamp - a.endTimestamp);
      } else {
        allProposals.sort((a, b) => b.timestamp - a.timestamp);
      }
      return allProposals;
    }

    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/proposals`,
        SafeProposalsResponseSchema,
        variables
      );
      return validated.items.map(normalizeProposal);
    } catch (error) {
      console.warn(`Error querying proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async listVotingPowerHistory(
    variables?: ListHistoricalVotingPowerQueryVariables,
    daoId?: string
  ): Promise<ProcessedVotingPowerHistory[]> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const results = await Promise.all(allDAOs.map(async (dao) => {
        try {
          const validated = await this.request(
            `${this.buildDaoPath(dao.id)}/voting-powers/historical`,
            SafeHistoricalVotingPowerResponseSchema,
            variables
          );
          return processVotingPowerHistory(validated.items as HistoricalVotingPower[], dao.id, dao.chainId);
        } catch (error) {
          console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
          return [];
        }
      }));

      return results.flat().sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/voting-powers/historical`,
        SafeHistoricalVotingPowerResponseSchema,
        variables
      );
      return processVotingPowerHistory(validated.items as HistoricalVotingPower[], daoId);
    } catch (error) {
      console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async listVotes(daoId: string, variables?: ListVotesQueryVariables): Promise<OnchainVote[]> {
    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/votes`,
        SafeVotesResponseSchema,
        variables
      );
      return validated.items.map(normalizeVote);
    } catch (error) {
      console.warn(`Error fetching votes for DAO ${daoId}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getProposalNonVoters(
    proposalId: string,
    daoId: string,
    addresses?: string[],
  ): Promise<ProposalNonVoter[]> {
    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/proposals/${encodeURIComponent(proposalId)}/non-voters`,
        SafeProposalNonVotersResponseSchema,
        addresses ? { addresses } : undefined
      );
      return validated.items.map(normalizeNonVoter);
    } catch (error) {
      console.warn(`Error fetching non-voters for proposal ${proposalId}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  async listRecentVotesFromAllDaos(timestampGt: string, limit: number = 100): Promise<VoteWithDaoId[]> {
    const daos = await this.getDAOs();
    const voteArrays = await Promise.all(daos.map(async (dao) => {
      try {
        const votes = await this.listVotes(dao.id, {
          fromDate: Number(timestampGt),
          limit,
          orderBy: QueryInput_Votes_OrderBy.Timestamp,
          orderDirection: OrderDirection.Asc,
        });

        return votes.map(vote => ({
          ...vote,
          daoId: dao.id,
        }));
      } catch (error) {
        console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error instanceof Error ? error.message : error);
        return [];
      }
    }));

    return voteArrays.flat().sort((a, b) => a.timestamp - b.timestamp);
  }

  async getEventThreshold(
    daoId: string,
    type: FeedEventType,
    relevance: FeedRelevance
  ): Promise<string | null> {
    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/event-relevance/threshold`,
        EventThresholdResponseSchema,
        { type, relevance }
      );
      return validated.threshold ?? null;
    } catch (error) {
      console.warn(
        `[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  async listOffchainProposals(
    variables?: ListOffchainProposalsQueryVariables,
    daoId?: string
  ): Promise<(OffchainProposalItem & { daoId: string })[]> {
    if (!daoId) {
      const allDAOs = await this.getDAOs();
      const results = await Promise.all(allDAOs.map(async (dao) => {
        if (!dao.supportOffchainData) {
          return [];
        }

        try {
          const validated = await this.request(
            `${this.buildDaoPath(dao.id)}/offchain/proposals`,
            SafeOffchainProposalsResponseSchema,
            variables
          );
          return validated.items.map(item => ({ ...normalizeOffchainProposal(item), daoId: dao.id }));
        } catch (error) {
          console.warn(`Skipping offchain proposals for ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
          return [];
        }
      }));

      return results.flat().sort((a, b) => b.created - a.created);
    }

    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/offchain/proposals`,
        SafeOffchainProposalsResponseSchema,
        variables
      );
      return validated.items.map(item => ({ ...normalizeOffchainProposal(item), daoId: toLegacyDaoId(daoId) }));
    } catch (error) {
      console.warn(`Error querying offchain proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  async listOffchainVotes(daoId: string, variables?: ListOffchainVotesQueryVariables): Promise<OffchainVoteItem[]> {
    try {
      const validated = await this.request(
        `${this.buildDaoPath(daoId)}/offchain/votes`,
        SafeOffchainVotesResponseSchema,
        variables
      );
      return validated.items.map(normalizeOffchainVote);
    } catch (error) {
      console.warn(`Error fetching offchain votes for DAO ${daoId}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  async listRecentOffchainVotesFromAllDaos(fromDate: number, limit: number = 100): Promise<OffchainVoteWithDaoId[]> {
    const daos = await this.getDAOs();
    const voteArrays = await Promise.all(daos.map(async (dao) => {
      try {
        const votes = await this.listOffchainVotes(dao.id, {
          fromDate,
          limit,
          orderBy: QueryInput_VotesOffchain_OrderBy.Timestamp,
          orderDirection: OrderDirection.Asc,
        });
        return votes.map(vote => ({
          ...vote,
          daoId: dao.id,
        }));
      } catch (error) {
        console.warn(`Failed to fetch offchain votes for DAO ${dao.id}:`, error instanceof Error ? error.message : error);
        return [];
      }
    }));

    return voteArrays.flat().sort((a, b) => a.created - b.created);
  }
}

export { FeedEventTypeEnum as FeedEventType, FeedRelevanceEnum as FeedRelevance };
