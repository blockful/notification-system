import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationTypeId } from '@notification-system/messages';
import { ProposalExecutableTrigger, ETA_MARGIN_SECONDS } from '../src/triggers/proposal-executable-trigger';
import { createProposal, DEFAULT_INTERVAL } from './fixtures';
import { SimpleDaoDataSource, SimpleDispatcherService, SimpleProposalDataSource } from './simple-doubles';

const ENS_TIMELOCK = 172_800;
const UNI_TIMELOCK = 172_800 * 2;
const NOW = 1_700_000_000;

const pending = (id: string, queuedTimestamp: number | null, daoId = 'ENS') =>
  createProposal({ id, daoId, status: 'PENDING_EXECUTION', queuedTimestamp, endTimestamp: 1_699_000_000 });

describe('ProposalExecutableTrigger', () => {
  let trigger: ProposalExecutableTrigger;
  let dispatcher: SimpleDispatcherService;
  let proposals: SimpleProposalDataSource;
  let daos: SimpleDaoDataSource;

  beforeEach(() => {
    dispatcher = new SimpleDispatcherService();
    proposals = new SimpleProposalDataSource();
    daos = new SimpleDaoDataSource([
      { id: 'ENS', timelockDelay: String(ENS_TIMELOCK) },
      { id: 'UNI', timelockDelay: String(UNI_TIMELOCK) },
    ]);
    trigger = new ProposalExecutableTrigger(proposals, daos, dispatcher, DEFAULT_INTERVAL, () => NOW);
  });

  describe('fetchData', () => {
    it('queries PENDING_EXECUTION proposals across all DAOs, no cursor', async () => {
      await trigger['fetchData']();

      expect(proposals.listAllCalls).toEqual([{ status: ['PENDING_EXECUTION'], limit: 100 }]);
    });
  });

  describe('process', () => {
    it('emits a proposal once queuedTimestamp + timelockDelay + margin has passed', async () => {
      const queuedTimestamp = NOW - ENS_TIMELOCK - ETA_MARGIN_SECONDS; // exactly eligible
      await trigger.process([pending('p1', queuedTimestamp)]);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: NotificationTypeId.ProposalExecutable,
        events: [{ id: 'p1', daoId: 'ENS', status: 'PENDING_EXECUTION', endTimestamp: 1_699_000_000 }],
      }]);
    });

    it('does not emit a proposal whose eta has not passed yet', async () => {
      await trigger.process([pending('p1', NOW - ENS_TIMELOCK - ETA_MARGIN_SECONDS + 1)]);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it("uses each DAO's own timelock delay", async () => {
      const queuedTimestamp = NOW - ENS_TIMELOCK - ETA_MARGIN_SECONDS; // eligible for ENS, not for UNI
      await trigger.process([pending('ens-1', queuedTimestamp, 'ENS'), pending('uni-1', queuedTimestamp, 'UNI')]);

      expect(dispatcher.sentMessages[0].events.map((e: { id: string }) => e.id)).toEqual(['ens-1']);
    });

    it('skips proposals that were never queued', async () => {
      await trigger.process([pending('p1', null)]);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('skips proposals of a DAO the API does not list', async () => {
      await trigger.process([pending('p1', NOW - 10 * ENS_TIMELOCK, 'UNKNOWN')]);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('does not send a message for an empty batch', async () => {
      await trigger.process([]);
      expect(dispatcher.sentMessages).toEqual([]);
      expect(daos.getDAOsCalls).toBe(0);
    });
  });
});
