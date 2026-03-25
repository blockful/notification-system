import { NOTIFICATION_TYPES } from '@notification-system/messages';
import { IUserNotificationPreferencesRepository, UserNotificationPreference } from '../interfaces/user_subscription.interface';

const validIds = new Set<string>(NOTIFICATION_TYPES.map(t => t.id));

export class SettingsService {
  constructor(private prefsRepo: IUserNotificationPreferencesRepository) {}

  async getUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    return this.prefsRepo.findByUser(userId);
  }

  async saveUserPreferences(
    userId: string,
    preferences: { trigger_type: string; is_active: boolean }[]
  ): Promise<void> {
    const invalid = preferences.filter(p => !validIds.has(p.trigger_type));
    if (invalid.length > 0) {
      throw new Error(`Unknown trigger types: ${invalid.map(p => p.trigger_type).join(', ')}`);
    }
    await this.prefsRepo.upsertMany(userId, preferences);
  }
}
