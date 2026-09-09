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
      expect(trigger['endTimestampCursor']).toBe(eligible + 1);

      // next poll must still see 'new'
      await trigger['fetchData']();
      expect(repo.listAllCalls.at(-1)?.fromEndDate).toBe(eligible + 1);
    });

    it('does not move the cursor when nothing is emitted', async () => {
      const before = trigger['endTimestampCursor'];
      await trigger.process([pending('p1', NOW - TIMELOCK)]);
      expect(trigger['endTimestampCursor']).toBe(before);
      expect(dispatcher.sentMessages).toEqual([]);
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
