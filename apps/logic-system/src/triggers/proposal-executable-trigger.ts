import { Trigger } from './base-trigger';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { ProposalDataSource, ProposalOnChain, ProposalExecutableNotification } from '../interfaces/proposal.interface';
import { NotificationTypeId } from '@notification-system/messages';

export interface ProposalExecutableTriggerOptions {
  /** DAOs to watch (the timelock delay below must match them, so keep the list homogeneous). */
  daoIds: string[];
  /** Governor timelock delay, in seconds. ENS: 172800 (2 days). */
  timelockDelaySeconds: number;
  /** Grace after `endTimestamp + timelockDelay` before emitting, in seconds. Covers the gap
   *  between the API flagging PENDING_EXECUTION (endTimestamp + delay) and the real on-chain
   *  eta (queueTime + delay). */
  marginSeconds: number;
  /** How far back the cursor starts on boot, in days. */
  lookbackDays: number;
  /** Unix seconds; injectable for tests. */
  now?: () => number;
}

/**
 * Detects on-chain proposals that became executable and emits one event per proposal.
 *
 * Webhook-only consumer today (the relayer). Same cursor pattern as ProposalFinishedTrigger:
 * eligibility is `endTimestamp + delay + margin`, and delay/margin are constants, so proposals
 * become eligible in endTimestamp order and an endTimestamp cursor is enough for exactly-once
 * emission within a process lifetime. The dispatcher dedupes across restarts.
 */
export class ProposalExecutableTrigger extends Trigger<ProposalOnChain, void> {
  protected endTimestampCursor: number;
  private readonly now: () => number;

  constructor(
    private readonly proposalRepository: ProposalDataSource,
    private readonly dispatcherService: DispatcherService,
    interval: number,
    private readonly triggerOptions: ProposalExecutableTriggerOptions,
  ) {
    super(NotificationTypeId.ProposalExecutable, interval);
    this.now = triggerOptions.now ?? (() => Math.floor(Date.now() / 1000));
    this.endTimestampCursor = this.now() - triggerOptions.lookbackDays * 86_400;
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    const batches = await Promise.all(
      this.triggerOptions.daoIds.map(daoId =>
        this.proposalRepository.listAll({
          daoId,
          status: ['PENDING_EXECUTION'],
          fromEndDate: this.endTimestampCursor,
          orderDirection: 'asc',
          limit: 100,
        }),
      ),
    );
    return batches.flat();
  }

  async process(data: ProposalOnChain[]): Promise<void> {
    const eligibleAt = this.now() - this.triggerOptions.timelockDelaySeconds - this.triggerOptions.marginSeconds;

    const events: ProposalExecutableNotification[] = data
      .filter(p => p?.endTimestamp != null && Number(p.endTimestamp) <= eligibleAt)
      .map(p => ({
        id: p.id,
        daoId: p.daoId,
        status: p.status ?? 'PENDING_EXECUTION',
        endTimestamp: Number(p.endTimestamp),
      }));

    if (events.length === 0) {
      return;
    }

    const message: DispatcherMessage<ProposalExecutableNotification> = {
      triggerId: this.id,
      events,
    };
    await this.dispatcherService.sendMessage(message);

    // Advance past what we emitted only: a later proposal still inside the margin
    // must come back on the next poll.
    this.endTimestampCursor = Math.max(...events.map(e => e.endTimestamp)) + 1;
  }
}
