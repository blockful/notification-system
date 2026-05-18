import {
  getDaos,
  proposal,
  proposals,
  getEventRelevanceThreshold,
  votes,
  proposalNonVoters,
  offchainProposalNonVoters,
  offchainProposals,
  votesOffchain,
  historicalVotingPower,
} from '@anticapture/client';
import type {
  FeedEventType,
  FeedRelevance,
  RequestConfig,
  HistoricalVotingPower,
  OnchainProposal,
  OnchainProposalsResponse,
  OnchainVote,
  OffchainVote,
  Voter,
  OffchainNonVoter,
  ProposalsQueryParams,
  VotesQueryParams,
  ProposalNonVotersQueryParams,
  OffchainProposalsQueryParams,
  VotesOffchainQueryParams,
  HistoricalVotingPowerQueryParams,
} from '@anticapture/client';
import { getAddress, isAddress } from 'viem';
import { withRetryAndTimeout } from './with-retry-and-timeout';
import type {
  OffchainProposalItem,
  OffchainVoteItem,
  ProcessedVotingPowerHistory,
} from './types';

function processProposals(
  res: OnchainProposalsResponse | null | undefined,
  daoId: string
): OnchainProposal[] {
  return (res?.items ?? []).map(p => ({ ...p, daoId }));
}

function processVotingPowerHistory(
  data: { historicalVotingPower: { items: HistoricalVotingPower[] } | null },
  daoId: string,
  chainId?: number
): ProcessedVotingPowerHistory[] {
  const items = data.historicalVotingPower?.items ?? [];
  return items
    .filter(item => item.accountId)
    .map(item => ({
      ...item,
      daoId,
      changeType: item.delegation ? 'delegation' : item.transfer ? 'transfer' : 'other',
      sourceAccountId: item.transfer?.from || item.delegation?.from || '',
      targetAccountId: item.accountId,
      previousDelegate: item.delegation?.previousDelegate || null,
      newDelegate: item.delegation?.to || null,
      ...(chainId !== undefined && { chainId }),
    }));
}

export interface AnticaptureClientConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  timeoutMs?: number;
}

export type VoteWithDaoId = OnchainVote & { daoId: string };
export type OffchainVoteWithDaoId = OffchainVote & { daoId: string };

export type DaoInfo = { id: string; blockTime: number; votingDelay: string; chainId: number; alreadySupportCalldataReview: boolean; supportOffchainData: boolean };

/**
 * Public surface of AnticaptureClient — used for dependency injection and mocking.
 */
export interface IAnticaptureClient {
  getDAOs(): Promise<Array<DaoInfo>>;
  getProposalById(id: string): Promise<OnchainProposal | null>;
  listProposals(variables?: ProposalsQueryParams, daoId?: string): Promise<OnchainProposal[]>;
  listVotingPowerHistory(variables?: HistoricalVotingPowerQueryParams, daoId?: string): Promise<ProcessedVotingPowerHistory[]>;
  listVotes(daoId: string, variables?: VotesQueryParams): Promise<OnchainVote[]>;
  getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<Voter[]>;
  getOffchainProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<OffchainNonVoter[]>;
  listRecentVotesFromAllDaos(timestampGt: string, limit?: number): Promise<VoteWithDaoId[]>;
  getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null>;
  listOffchainProposals(variables?: OffchainProposalsQueryParams, daoId?: string): Promise<(OffchainProposalItem & { daoId: string })[]>;
  listOffchainVotes(daoId: string, variables?: VotesOffchainQueryParams): Promise<OffchainVoteItem[]>;
  listRecentOffchainVotesFromAllDaos(fromDate: number, limit?: number): Promise<OffchainVoteWithDaoId[]>;
}

export class AnticaptureClient implements IAnticaptureClient {
  private readonly retries: number;
  private readonly timeoutMs: number;
  private readonly sdkConfig: Partial<RequestConfig>;

  constructor(config: AnticaptureClientConfig) {
    this.retries = config.maxRetries ?? 4;
    this.timeoutMs = config.timeoutMs ?? 15000;
    this.sdkConfig = {
      baseURL: config.baseURL,
      headers: {
        'x-client-source': 'notification-system',
        ...config.defaultHeaders,
      },
    };
  }

  private async call<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
    return withRetryAndTimeout(fn, { retries: this.retries, timeoutMs: this.timeoutMs });
  }

  private normalizeAddressesInObject(obj: any, transformer: (a: string) => string): any {
    if (obj == null) return obj;
    if (typeof obj === 'string') {
      try { return isAddress(obj) ? transformer(obj) : obj; } catch { return obj; }
    }
    if (Array.isArray(obj)) return obj.map(i => this.normalizeAddressesInObject(i, transformer));
    if (typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.normalizeAddressesInObject(v, transformer)]));
    }
    return obj;
  }

  private toChecksum<T>(o: T): T { return this.normalizeAddressesInObject(o, getAddress); }
  private toLowercase<T>(o: T): T { return this.normalizeAddressesInObject(o, a => a.toLowerCase()); }

  async getDAOs(): Promise<Array<{ id: string; blockTime: number; votingDelay: string; chainId: number; alreadySupportCalldataReview: boolean; supportOffchainData: boolean }>> {
    try {
      const res = await this.call(() => getDaos(this.sdkConfig));
      const items = res.items ?? [];
      return items.map(d => ({
        id: d.id,
        blockTime: 12,
        votingDelay: d.votingDelay ?? '0',
        chainId: d.chainId ?? 1,
        alreadySupportCalldataReview: d.alreadySupportCalldataReview ?? false,
        supportOffchainData: d.supportOffchainData ?? false,
      }));
    } catch (err) {
      console.warn('Returning empty DAO list due to API error:', err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getProposalById(id: string): Promise<OnchainProposal | null> {
    const allDaos = await this.getDAOs();
    for (const dao of allDaos) {
      try {
        // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
        const res = await this.call(() => proposal(dao.id as any, id, this.sdkConfig));
        if (res) return this.toLowercase(res);
      } catch (err) {
        const e = err as { status?: number; response?: { status?: number } };
        // 404 means this DAO doesn't have the proposal — continue to next
        if (e?.status === 404 || e?.response?.status === 404) continue;
        // other errors: log and continue
        console.warn(`[AnticaptureClient] Error fetching proposal ${id} from DAO ${dao.id}:`, err instanceof Error ? err.message : err);
      }
    }
    return null;
  }

  async listProposals(variables?: ProposalsQueryParams, daoId?: string): Promise<OnchainProposal[]> {
    if (daoId) {
      try {
        // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
        const res = await this.call(() => proposals(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        return this.toLowercase(processProposals(res, daoId));
      } catch (err) {
        console.warn(`[AnticaptureClient] Error querying proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
        return [];
      }
    }

    const allDaos = await this.getDAOs();
    const all: OnchainProposal[] = [];
    for (const dao of allDaos) {
      try {
        // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
        const res = await this.call(() => proposals(dao.id as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        const processed = processProposals(res, dao.id);
        if (processed.length) all.push(...processed);
      } catch (err) {
        console.warn(`[AnticaptureClient] Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
      }
    }

    if (variables?.fromEndDate) {
      all.sort((a, b) => (b.endTimestamp ?? 0) - (a.endTimestamp ?? 0));
    } else {
      all.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    }
    return this.toLowercase(all);
  }
  async listVotingPowerHistory(variables?: HistoricalVotingPowerQueryParams, daoId?: string): Promise<ProcessedVotingPowerHistory[]> {
    if (daoId) {
      try {
        const res = await this.call(() => historicalVotingPower(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        return this.toLowercase(processVotingPowerHistory({ historicalVotingPower: res }, daoId));
      } catch (err) {
        console.warn(`[AnticaptureClient] Error querying voting power history for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
        return [];
      }
    }

    const allDaos = await this.getDAOs();
    const promises = allDaos.map(async (dao) => {
      try {
        const res = await this.call(() => historicalVotingPower(dao.id as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        return processVotingPowerHistory({ historicalVotingPower: res }, dao.id, dao.chainId);
      } catch (err) {
        console.warn(`[AnticaptureClient] Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return this.toLowercase(
      results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
    );
  }

  async listVotes(daoId: string, variables?: VotesQueryParams): Promise<OnchainVote[]> {
    try {
      // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
      const res = await this.call(() => votes(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<Voter[]> {
    try {
      const params: ProposalNonVotersQueryParams = addresses?.length ? { addresses } : {};
      // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
      const res = await this.call(() => proposalNonVoters(daoId as any, proposalId, this.toChecksum(params), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching non-voters for proposal ${proposalId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getOffchainProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<OffchainNonVoter[]> {
    const params = addresses?.length ? { addresses } : {};
    try {
      // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
      const res = await this.call(() => offchainProposalNonVoters(daoId as any, proposalId, this.toChecksum(params), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching offchain non-voters for proposal ${proposalId} from DAO ${daoId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async listRecentVotesFromAllDaos(timestampGt: string, limit: number = 100): Promise<VoteWithDaoId[]> {
    const daos = await this.getDAOs();
    const voteArrays = await Promise.all(
      daos.map(async (dao) => {
        const vs = await this.listVotes(dao.id, {
          fromDate: parseInt(timestampGt),
          limit,
          orderBy: 'timestamp',
          orderDirection: 'asc',
        });
        return vs.map(v => ({ ...v, daoId: dao.id }));
      })
    );
    return voteArrays.flat().sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }

  async getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null> {
    try {
      // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
      const res = await this.call(() => getEventRelevanceThreshold(daoId as any, { type, relevance }, this.sdkConfig));
      return res?.threshold ?? null;
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  async listOffchainProposals(variables?: OffchainProposalsQueryParams, daoId?: string): Promise<(OffchainProposalItem & { daoId: string })[]> {
    if (daoId) {
      try {
        const res = await this.call(() => offchainProposals(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        const items = (res?.items ?? []).map(i => ({ ...i, daoId }));
        return this.toLowercase(items);
      } catch (err) {
        console.warn(`[AnticaptureClient] Error querying offchain proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
        return [];
      }
    }

    const allDaos = await this.getDAOs();
    const all: (OffchainProposalItem & { daoId: string })[] = [];
    for (const dao of allDaos) {
      if (!dao.supportOffchainData) continue;
      try {
        const res = await this.call(() => offchainProposals(dao.id as any, this.toChecksum(variables ?? {}), this.sdkConfig));
        const items = (res?.items ?? []).map(i => ({ ...i, daoId: dao.id }));
        if (items.length) all.push(...items);
      } catch (err) {
        console.warn(`[AnticaptureClient] Skipping offchain proposals for ${dao.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
    all.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    return this.toLowercase(all);
  }

  async listOffchainVotes(daoId: string, variables?: VotesOffchainQueryParams): Promise<OffchainVoteItem[]> {
    try {
      // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
      const res = await this.call(() => votesOffchain(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching offchain votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async listRecentOffchainVotesFromAllDaos(fromDate: number, limit: number = 100): Promise<OffchainVoteWithDaoId[]> {
    const daos = await this.getDAOs();
    const voteArrays = await Promise.all(
      daos
        .filter(dao => dao.supportOffchainData)
        .map(async (dao) => {
          const vs = await this.listOffchainVotes(dao.id, {
            fromDate,
            limit,
            orderBy: 'timestamp',
            orderDirection: 'asc',
          });
          return vs.map(v => ({ ...v, daoId: dao.id }));
        })
    );
    return voteArrays.flat().sort((a, b) => (a.created ?? 0) - (b.created ?? 0));
  }
}
