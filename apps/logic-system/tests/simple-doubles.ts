import {
  AnticaptureClient,
  OffchainVoteWithDaoId,
  ProcessedVotingPowerHistory,
  FeedEventType,
} from '@notification-system/anticapture-client';
import {
  DispatcherMessage,
  DispatcherService,
} from '../src/interfaces/dispatcher.interface';
import {
  ListProposalsOptions,
  ProposalDataSource,
  ProposalOnChain,
  ProposalOrNull,
} from '../src/interfaces/proposal.interface';
import {
  ListOffchainProposalsOptions,
  OffchainProposal,
  OffchainProposalDataSource,
} from '../src/interfaces/offchain-proposal.interface';
import {
  VotingReminderDataSource,
  VotingReminderProposal,
} from '../src/interfaces/voting-reminder.interface';
import { IVotingPowerRepository } from '../src/repositories/voting-power.repository';
import { IThresholdRepository } from '../src/repositories/threshold.repository';
import { OffchainVotesRepository } from '../src/repositories/offchain-votes.repository';

export class SimpleDispatcherService implements DispatcherService {
  sentMessages: DispatcherMessage[] = [];
  sendError?: Error;

  async sendMessage<T = any>(message: DispatcherMessage<T>): Promise<void> {
    if (this.sendError) throw this.sendError;
    this.sentMessages.push(message as DispatcherMessage);
  }
}

export class SimpleProposalDataSource implements ProposalDataSource {
  listAllResult: ProposalOnChain[] = [];
  getByIdResult: ProposalOrNull = null;
  listAllError?: Error;
  getByIdError?: Error;

  listAllCalls: (ListProposalsOptions | undefined)[] = [];
  getByIdCalls: string[] = [];

  async getById(id: string): Promise<ProposalOrNull> {
    this.getByIdCalls.push(id);
    if (this.getByIdError) throw this.getByIdError;
    return this.getByIdResult;
  }

  async listAll(options?: ListOffchainProposalsOptions): Promise<ProposalOnChain[]> {
    this.listAllCalls.push(options as ListProposalsOptions | undefined);
    if (this.listAllError) throw this.listAllError;
    return this.listAllResult;
  }
}

export class SimpleVotingPowerRepository implements IVotingPowerRepository {
  /**
   * FIFO queue consumed by successive listVotingPowerHistory calls.
   * When empty, listAllDefault is used. Items can be data arrays or Errors.
   */
  resultQueue: (ProcessedVotingPowerHistory[] | Error)[] = [];
  defaultResult: ProcessedVotingPowerHistory[] | Error = [];
  listCalls: string[] = [];

  async listVotingPowerHistory(timestampGt: string): Promise<ProcessedVotingPowerHistory[]> {
    this.listCalls.push(timestampGt);
    const next = this.resultQueue.length > 0 ? this.resultQueue.shift()! : this.defaultResult;
    if (next instanceof Error) throw next;
    return next;
  }
}

export class SimpleThresholdRepository implements IThresholdRepository {
  thresholdsByKey = new Map<string, string | null>();
  defaultThreshold: string | null = null;
  getCalls: Array<{ daoId: string; type: FeedEventType }> = [];

  async getThreshold(daoId: string, type: FeedEventType): Promise<string | null> {
    this.getCalls.push({ daoId, type });
    const key = `${daoId}:${type}`;
    return this.thresholdsByKey.has(key)
      ? this.thresholdsByKey.get(key)!
      : this.defaultThreshold;
  }
}

export class SimpleVotingReminderDataSource implements VotingReminderDataSource {
  listResult: VotingReminderProposal[] = [];
  listError?: Error;
  listCalls = 0;

  async listActiveForReminder(): Promise<VotingReminderProposal[]> {
    this.listCalls++;
    if (this.listError) throw this.listError;
    return this.listResult;
  }
}

export class SimpleOffchainProposalDataSource implements OffchainProposalDataSource {
  listResult: OffchainProposal[] = [];
  listError?: Error;
  listCalls: ListOffchainProposalsOptions[] = [];

  async listAll(options?: ListOffchainProposalsOptions): Promise<OffchainProposal[]> {
    if (options) this.listCalls.push(options);
    if (this.listError) throw this.listError;
    return this.listResult;
  }
}

export class SimpleOffchainVotesRepository extends OffchainVotesRepository {
  resultQueue: (OffchainVoteWithDaoId[] | Error)[] = [];
  defaultResult: OffchainVoteWithDaoId[] | Error = [];
  listCalls: number[] = [];

  constructor() {
    super(new AnticaptureClient({ baseURL: 'http://localhost' }));
  }

  override async listRecentOffchainVotes(fromTimestamp: number): Promise<OffchainVoteWithDaoId[]> {
    this.listCalls.push(fromTimestamp);
    const next = this.resultQueue.length > 0 ? this.resultQueue.shift()! : this.defaultResult;
    if (next instanceof Error) throw next;
    return next;
  }
}
