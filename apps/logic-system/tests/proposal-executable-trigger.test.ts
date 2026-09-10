import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationTypeId } from '@notification-system/messages';
import { ProposalExecutableTrigger } from '../src/triggers/proposal-executable-trigger';
import { createProposal, DEFAULT_INTERVAL } from './fixtures';
import { SimpleDispatcherService, SimpleProposalDataSource } from './simple-doubles';

const DAY = 86_400;
const TIMELOCK = 2 * DAY;
const MARGIN = 3_600;
const NOW = 1_700_000_000;

const pending = (id: string, endTimestamp: number, daoId = 'ens') =>
  createProposal({ id, daoId, status: 'PENDING_EXECUTION', endTimestamp: String(endTimestamp) });

describe('ProposalExecutableTrigger', () => {
  let trigger: ProposalExecutableTrigger;
  let dispatcher: SimpleDispatcherService;
  let repo: SimpleProposalDataSource;

  beforeEach(() => {
    dispatcher = new SimpleDispatcherService();
    repo = new SimpleProposalDataSource();
    trigger = new ProposalExecutableTrigger(repo, dispatcher, DEFAULT_INTERVAL, {
      daoIds: ['ens'],
      timelockDelaySeconds: TIMELOCK,
      marginSeconds: MARGIN,
      lookbackDays: 3,
      now: () => NOW,
    });
  });

  describe('fetchData', () => {
    it('queries PENDING_EXECUTION per DAO from the lookback cursor, oldest first', async () => {
      await trigger['fetchData']();

      expect(repo.listAllCalls).toEqual([{
        daoId: 'ens',
        status: ['PENDING_EXECUTION'],
        fromEndDate: NOW - 3 * DAY,
        orderDirection: 'asc',
        limit: 100,
      }]);
    });

    it('queries every configured DAO', async () => {
      trigger = new ProposalExecutableTrigger(repo, dispatcher, DEFAULT_INTERVAL, {
        daoIds: ['ens', 'uni'], timelockDelaySeconds: TIMELOCK, marginSeconds: MARGIN, lookbackDays: 3, now: () => NOW,
      });
      await trigger['fetchData']();
      expect(repo.listAllCalls.map(c => c?.daoId)).toEqual(['ens', 'uni']);
    });

    it("keeps processing other DAOs when one DAO's query fails", async () => {
      trigger = new ProposalExecutableTrigger(repo, dispatcher, DEFAULT_INTERVAL, {
        daoIds: ['ens', 'uni'], timelockDelaySeconds: TIMELOCK, marginSeconds: MARGIN, lookbackDays: 3, now: () => NOW,
      });
      repo.failFor.add('ens');
      const uniProposal = pending('p1', NOW - TIMELOCK - MARGIN, 'uni');
      repo.listAllResult = [uniProposal];

      const data = await trigger['fetchData']();

      expect(data).toEqual([uniProposal]);
    });
  });

  describe('process', () => {
    it('emits a proposal once its eta plus margin has passed', async () => {
      const endTimestamp = NOW - TIMELOCK - MARGIN; // exactly eligible
      await trigger.process([pending('p1', endTimestamp)]);

      expect(dispatcher.sentMessages).toEqual([{
        triggerId: NotificationTypeId.ProposalExecutable,
        events: [{ id: 'p1', daoId: 'ens', status: 'PENDING_EXECUTION', endTimestamp }],
      }]);
    });

    it('does not emit a proposal still inside the margin', async () => {
      await trigger.process([pending('p1', NOW - TIMELOCK - MARGIN + 1)]);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('advances the cursor over emitted proposals only', async () => {
      const eligible = NOW - TIMELOCK - MARGIN - 10;
      const tooSoon = NOW - TIMELOCK; // PENDING_EXECUTION per API, but margin not elapsed
      await trigger.process([pending('old', eligible), pending('new', tooSoon)]);

      expect(dispatcher.sentMessages[0].events.map((e: { id: string }) => e.id)).toEqual(['old']);
      expect(trigger['cursors'].get('ens')).toBe(eligible + 1);

      // next poll must still see 'new'
      await trigger['fetchData']();
      expect(repo.listAllCalls.at(-1)?.fromEndDate).toBe(eligible + 1);
    });

    it('does not move the cursor when nothing is emitted', async () => {
      const before = trigger['cursors'].get('ens');
      await trigger.process([pending('p1', NOW - TIMELOCK)]);
      expect(trigger['cursors'].get('ens')).toBe(before);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('advances only the cursor of the DAO that emitted', async () => {
      trigger = new ProposalExecutableTrigger(repo, dispatcher, DEFAULT_INTERVAL, {
        daoIds: ['ens', 'uni'], timelockDelaySeconds: TIMELOCK, marginSeconds: MARGIN, lookbackDays: 3, now: () => NOW,
      });
      const initialCursor = NOW - 3 * DAY;
      const eligible = NOW - TIMELOCK - MARGIN;

      await trigger.process([pending('p1', eligible, 'ens')]);

      expect(trigger['cursors'].get('ens')).toBe(eligible + 1);
      expect(trigger['cursors'].get('uni')).toBe(initialCursor);

      // next poll must still send the untouched lookback cursor for 'uni'
      await trigger['fetchData']();
      const uniCall = repo.listAllCalls.find(c => c?.daoId === 'uni');
      expect(uniCall?.fromEndDate).toBe(initialCursor);
    });

    it('never moves the cursor backwards', async () => {
      // Simulate a cursor that has already advanced past this batch's proposal
      // (e.g. a previous cycle already emitted something newer for this DAO).
      const eligible = NOW - TIMELOCK - MARGIN - 100;
      trigger['cursors'].set('ens', eligible + 50);

      await trigger.process([pending('old', eligible)]);

      expect(trigger['cursors'].get('ens')).toBe(eligible + 50);
    });

    it('does not send a message for an empty batch', async () => {
      await trigger.process([]);
      expect(dispatcher.sentMessages).toEqual([]);
    });

    it('skips proposals without an endTimestamp', async () => {
      await trigger.process([createProposal({ id: 'x', status: 'PENDING_EXECUTION', endTimestamp: null })]);
      expect(dispatcher.sentMessages).toEqual([]);
    });
  });
});
