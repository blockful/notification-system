import { describe, test, expect } from '@jest/globals';
import { NOTIFICATION_TYPES } from '@notification-system/messages';

describe('NOTIFICATION_TYPES safety net', () => {
  test('all dispatcher handler IDs have matching NOTIFICATION_TYPES entry', () => {
    const notificationTypeIds = NOTIFICATION_TYPES.map(t => t.id);
    const registeredIds = [
      'new-proposal', 'new-offchain-proposal', 'proposal-finished',
      'non-voting', 'voting-reminder-30', 'voting-reminder-60', 'voting-reminder-90',
      'voting-power-changed', 'vote-confirmation', 'offchain-vote-cast'
    ];
    for (const id of registeredIds) {
      expect(notificationTypeIds).toContain(id);
    }
  });
});
