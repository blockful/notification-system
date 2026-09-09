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
 *
 * The cursor is tracked per DAO: DAOs can have independent indexer lag, so a single shared
 * cursor would let one DAO's emission permanently skip past another DAO's not-yet-eligible
 * proposal. Similarly, DAOs are fetched independently (`Promise.allSettled`) so that one DAO's
 * API error doesn't stall every other DAO's polling cycle.
 */
export class ProposalExecutableTrigger extends Trigger<ProposalOnChain, void> {
  private readonly cursors: Map<string, number>;
  private readonly now: () => number;

  constructor(
    private readonly proposalRepository: ProposalDataSource,
    private readonly dispatcherService: DispatcherService,
    interval: number,
    private readonly triggerOptions: ProposalExecutableTriggerOptions,
  ) {
    super(NotificationTypeId.ProposalExecutable, interval);
    this.now = triggerOptions.now ?? (() => Math.floor(Date.now() / 1000));
    const initialCursor = this.now() - triggerOptions.lookbackDays * 86_400;
    this.cursors = new Map(triggerOptions.daoIds.map(daoId => [daoId, initialCursor]));
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    const results = await Promise.allSettled(
      this.triggerOptions.daoIds.map(daoId =>
        this.proposalRepository.listAll({
          daoId,
          status: ['PENDING_EXECUTION'],
          fromEndDate: this.cursors.get(daoId),
          orderDirection: 'asc',
          limit: 100,
        }),
      ),
    );

    const batches: ProposalOnChain[][] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        batches.push(result.value);
        return;
      }
      this.logger.warn(
        {
          err: result.reason,
          daoId: this.triggerOptions.daoIds[index],
          event: 'proposal_executable.fetch_failed',
        },
        'failed to fetch PENDING_EXECUTION proposals for dao; skipping this cycle',
      );
    });
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

    // Advance only the cursor of each DAO that emitted, past the highest endTimestamp
    // emitted for that DAO. A later proposal still inside the margin, or a proposal
    // from a DAO that emitted nothing this cycle, must come back on the next poll.
    const maxEndTimestampByDao = new Map<string, number>();
    for (const event of events) {
      const current = maxEndTimestampByDao.get(event.daoId);
      if (current === undefined || event.endTimestamp > current) {
        maxEndTimestampByDao.set(event.daoId, event.endTimestamp);
      }
    }
    for (const [daoId, maxEndTimestamp] of maxEndTimestampByDao) {
      this.cursors.set(daoId, maxEndTimestamp + 1);
    }
  }
}
