import { getDaos } from '@anticapture/client';
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

  async getProposalById(_id: string): Promise<any | null> { throw new Error('not migrated yet'); }
  async listProposals(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listVotingPowerHistory(..._args: any[]): Promise<ProcessedVotingPowerHistory[]> { throw new Error('not migrated yet'); }
  async listVotes(_daoId: string, ..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async getProposalNonVoters(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async getOffchainProposalNonVoters(..._args: any[]): Promise<any[]> { throw new Error('not migrated yet'); }
  async listRecentVotesFromAllDaos(..._args: any[]): Promise<VoteWithDaoId[]> { throw new Error('not migrated yet'); }
  async getEventThreshold(_daoId: string, _type: FeedEventType, _relevance: FeedRelevance): Promise<string | null> { throw new Error('not migrated yet'); }
  async listOffchainProposals(..._args: any[]): Promise<(OffchainProposalItem & { daoId: string })[]> { throw new Error('not migrated yet'); }
  async listOffchainVotes(_daoId: string, ..._args: any[]): Promise<OffchainVoteItem[]> { throw new Error('not migrated yet'); }
  async listRecentOffchainVotesFromAllDaos(..._args: any[]): Promise<OffchainVoteWithDaoId[]> { throw new Error('not migrated yet'); }
}
