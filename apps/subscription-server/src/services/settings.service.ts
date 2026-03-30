import type { NotificationTypeId } from '@notification-system/messages';
import { IUserNotificationPreferencesRepository, UserNotificationPreference } from '../interfaces/user_subscription.interface';

export class SettingsService {
  constructor(private prefsRepo: IUserNotificationPreferencesRepository) {}

  async getUserPreferences(userId: string): Promise<UserNotificationPreference[]> {
    return this.prefsRepo.findByUser(userId);
  }

  async saveUserPreferences(
    userId: string,
    preferences: { trigger_type: NotificationTypeId; is_active: boolean }[]
  ): Promise<void> {
    await this.prefsRepo.upsertMany(userId, preferences);
  }
}
