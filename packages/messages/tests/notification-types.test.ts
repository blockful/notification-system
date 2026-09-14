import { describe, it, expect } from 'vitest';
import { NotificationTypeId, NOTIFICATION_TYPES, USER_FACING_NOTIFICATION_TYPES } from '../src/notification-types';

describe('notification types', () => {
  it('has a label for every id', () => {
    for (const id of Object.values(NotificationTypeId)) {
      expect(NOTIFICATION_TYPES[id]).toBeTruthy();
    }
  });

  it('keeps webhook-only types out of the user-facing list', () => {
    expect(USER_FACING_NOTIFICATION_TYPES).not.toContain(NotificationTypeId.ProposalExecutable);
    expect(USER_FACING_NOTIFICATION_TYPES).toContain(NotificationTypeId.ProposalFinished);
  });
});
