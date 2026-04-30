import {
  getDaos,
  proposal,
  getEventRelevanceThreshold,
  votes,
  proposalNonVoters,
  offchainProposalNonVoters,
  votesOffchain,
} from '@anticapture/client';
import type { RequestConfig } from '@anticapture/client';
import { getAddress, isAddress } from 'viem';
import { withRetryAndTimeout } from './with-retry-and-timeout';
import type {
  FeedEventType,
  FeedRelevance,
  OffchainProposalItem,
  OffchainVoteItem,
  ProcessedVotingPowerHistory,
} from './schemas';

export interface AnticaptureClientConfig {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  timeoutMs?: number;
}

export type VoteWithDaoId = { daoId: string; [key: string]: any };
export type OffchainVoteWithDaoId = { daoId: string; [key: string]: any };

export class AnticaptureClient {
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

  private toChecksum(o: any) { return this.normalizeAddressesInObject(o, getAddress); }
  private toLowercase(o: any) { return this.normalizeAddressesInObject(o, a => a.toLowerCase()); }

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

  async getProposalById(id: string): Promise<any | null> {
    const allDaos = await this.getDAOs();
    for (const dao of allDaos) {
      try {
        const res = await this.call(() => proposal(dao.id as any, id, this.sdkConfig));
        if (res) return this.toLowercase(res);
      } catch (err: any) {
        // 404 means this DAO doesn't have the proposal — continue to next
        if (err?.status === 404 || err?.response?.status === 404) continue;
        // other errors: log and continue
        console.warn(`[AnticaptureClient] Error fetching proposal ${id} from DAO ${dao.id}:`, err instanceof Error ? err.message : err);
      }
    }
    return null;
  }

  async listProposals(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listVotingPowerHistory(..._args: any[]): Promise<ProcessedVotingPowerHistory[]> { throw new Error('not migrated yet'); }

  async listVotes(daoId: string, variables?: any): Promise<any[]> {
    try {
      const res = await this.call(() => votes(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getProposalNonVoters(proposalId: string, daoId: string, addresses?: string[]): Promise<any[]> {
    try {
      const params = addresses?.length ? { addresses } : {};
      const res = await this.call(() => proposalNonVoters(daoId as any, proposalId, this.toChecksum(params), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching non-voters for proposal ${proposalId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getOffchainProposalNonVoters(proposalId: string, addresses?: string[]): Promise<{ voter: string; votingPower?: string }[]> {
    const allDaos = await this.getDAOs();
    const offchainDaos = allDaos.filter(d => d.supportOffchainData);
    const params = addresses?.length ? { addresses } : {};
    for (const dao of offchainDaos) {
      try {
        const res = await this.call(() => offchainProposalNonVoters(dao.id as any, proposalId, this.toChecksum(params), this.sdkConfig));
        if (res?.items?.length >= 0) return this.toLowercase(res.items);
      } catch (err: any) {
        if (err?.status === 404 || err?.response?.status === 404) continue;
        console.warn(`[AnticaptureClient] Error fetching offchain non-voters for proposal ${proposalId} from DAO ${dao.id}:`, err instanceof Error ? err.message : err);
      }
    }
    return [];
  }

  async listRecentVotesFromAllDaos(..._args: any[]): Promise<VoteWithDaoId[]> { throw new Error('not migrated yet'); }

  async getEventThreshold(daoId: string, type: FeedEventType, relevance: FeedRelevance): Promise<string | null> {
    try {
      const res = await this.call(() => getEventRelevanceThreshold(daoId as any, { type, relevance }, this.sdkConfig));
      return res?.threshold ?? null;
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, err instanceof Error ? err.message : err);
      return null;
    }
  }

  async listOffchainProposals(..._args: any[]): Promise<(OffchainProposalItem & { daoId: string })[]> { throw new Error('not migrated yet'); }

  async listOffchainVotes(daoId: string, variables?: any): Promise<OffchainVoteItem[]> {
    try {
      const res = await this.call(() => votesOffchain(daoId as any, this.toChecksum(variables ?? {}), this.sdkConfig));
      return this.toLowercase(res?.items ?? []);
    } catch (err) {
      console.warn(`[AnticaptureClient] Error fetching offchain votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async listRecentOffchainVotesFromAllDaos(..._args: any[]): Promise<OffchainVoteWithDaoId[]> { throw new Error('not migrated yet'); }
}
