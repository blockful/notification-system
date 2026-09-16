import { Trigger } from './base-trigger';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import {
  DaoDataSource,
  ProposalDataSource,
  ProposalOnChain,
  ProposalExecutableNotification,
} from '../interfaces/proposal.interface';
import { NotificationTypeId } from '@notification-system/messages';

/** Wall-clock tolerance after the on-chain eta: block timestamps can lag `Date.now()` by a few seconds. */
export const ETA_MARGIN_SECONDS = 60;

/**
 * Emits one event per on-chain proposal whose timelock eta has passed. Webhook-only
 * consumer today (the relayer).
 *
 * The eta is `queuedTimestamp + timelockDelay`, the Governor's own formula, with both
 * values read from the API (`/{dao}/proposals` and `/daos`), so no per-DAO constants
 * live here. The API's PENDING_EXECUTION status alone is not enough: it is derived
 * from `endTimestamp + timelockDelay` and flags a proposal early whenever it was
 * queued some time after voting ended.
 *
 * There is no cursor. Every poll lists the PENDING_EXECUTION proposals of every DAO
 * and emits the eligible ones; the dispatcher's DB-backed dedupe (one notification
 * per eventId) makes delivery exactly-once, across restarts too. The set is tiny
 * (proposals queued but not yet executed), so re-checking it each cycle is cheap.
 */
export class ProposalExecutableTrigger extends Trigger<ProposalOnChain, void> {
  constructor(
    private readonly proposalRepository: ProposalDataSource,
    private readonly daoRepository: DaoDataSource,
    private readonly dispatcherService: DispatcherService,
    interval: number,
    /** Unix seconds; injectable for tests. */
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {
    super(NotificationTypeId.ProposalExecutable, interval);
  }

  protected async fetchData(): Promise<ProposalOnChain[]> {
    return this.proposalRepository.listAll({ status: ['PENDING_EXECUTION'], limit: 100 });
  }

  async process(data: ProposalOnChain[]): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const daos = await this.daoRepository.getDAOs();
    const timelockDelayByDao = new Map(daos.map(dao => [dao.id, Number(dao.timelockDelay)]));
    const now = this.now();

    const events: ProposalExecutableNotification[] = data
      .filter(p => {
        const timelockDelay = timelockDelayByDao.get(p.daoId);
        if (p.queuedTimestamp == null || timelockDelay === undefined) {
          return false;
        }
        return Number(p.queuedTimestamp) + timelockDelay + ETA_MARGIN_SECONDS <= now;
      })
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
  }
}
