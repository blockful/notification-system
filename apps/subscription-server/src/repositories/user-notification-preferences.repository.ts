import { Knex } from 'knex';
import type { NotificationTypeId } from '@notification-system/messages';
import {
  IUserNotificationPreferencesRepository,
  UserNotificationPreference,
} from '../interfaces/user_subscription.interface';

/**
 * Repository for managing per-trigger notification preferences.
 *
 * Design note: a missing row means the user has NOT explicitly disabled the
 * trigger, so it is treated as enabled. Only rows with `is_active = false`
 * mean "disabled". This keeps the happy-path (no preferences stored) fast
 * and requires no seed data.
 */
export class UserNotificationPreferencesRepository
  implements IUserNotificationPreferencesRepository
{
  constructor(private readonly knex: Knex) {}

  /**
   * Returns all stored notification preference rows for a user.
   * A missing row should be interpreted as "enabled" by callers.
   */
  async findByUser(userId: string): Promise<UserNotificationPreference[]> {
    return this.knex<UserNotificationPreference>('user_notification_preferences')
      .where({ user_id: userId })
      .select('*');
  }

  /**
   * Inserts or updates notification preferences for a user in a single query.
   * On conflict (user_id, trigger_type) it merges `is_active` and `updated_at`.
   */
  async upsertMany(
    userId: string,
    preferences: { trigger_type: NotificationTypeId; is_active: boolean }[]
  ): Promise<void> {
    if (preferences.length === 0) return;

    const rows = preferences.map(p => ({
      user_id: userId,
      trigger_type: p.trigger_type,
      is_active: p.is_active,
      updated_at: this.knex.fn.now(),
    }));

    await this.knex('user_notification_preferences')
      .insert(rows)
      .onConflict(['user_id', 'trigger_type'])
      .merge(['is_active', 'updated_at']);
  }

  /**
   * Filters out users who have explicitly disabled `triggerType`.
   *
   * Only rows with `is_active = false` are fetched; users with no row or
   * `is_active = true` are considered active and are kept in the result.
   *
   * @param userIds - Candidate user IDs to filter
   * @param triggerType - The trigger type to check
   * @returns Subset of `userIds` that have NOT disabled the trigger
   */
  async filterActiveUsers(userIds: string[], triggerType: NotificationTypeId): Promise<string[]> {
    if (userIds.length === 0) return [];

    const disabled = await this.knex('user_notification_preferences')
      .where({ trigger_type: triggerType, is_active: false })
      .whereIn('user_id', userIds)
      .select('user_id');

    const disabledSet = new Set(disabled.map((r: { user_id: string }) => r.user_id));
    return userIds.filter(id => !disabledSet.has(id));
  }
}
