import { NotificationTypeId } from '@notification-system/messages';
import { IUserNotificationPreferencesRepository, UserNotificationPreference } from '../interfaces/user_subscription.interface';

export class SettingsService {
  constructor(private prefsRepo: IUserNotificationPreferencesRepository) {}

  async getUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    const stored = await this.prefsRepo.findByUser(userId);
    const validTriggerTypes = new Set<string>(Object.values(NotificationTypeId));
    return stored.filter(p => validTriggerTypes.has(p.trigger_type));
  }

  async saveUserPreferences(
    userId: string,
    preferences: { trigger_type: NotificationTypeId; is_active: boolean }[]
  ): Promise<void> {
    await this.prefsRepo.upsertMany(userId, preferences);
  }
}
