import { NOTIFICATION_TYPES } from '@notification-system/messages';
import { SubscriptionAPIService } from '../subscription-api.service';

export abstract class BaseSettingsService {
  constructor(
    protected subscriptionApi: SubscriptionAPIService,
    protected platform: string
  ) {}

  protected async loadPreferences(channelUserId: string): Promise<Record<string, boolean>> {
    const stored = await this.subscriptionApi.getNotificationPreferences(
      this.platform,
      channelUserId
    );
    const result: Record<string, boolean> = {};
    for (const t of NOTIFICATION_TYPES) {
      result[t.id] = true; // default: enabled
    }
    for (const pref of stored) {
      if (pref.trigger_type in result) {
        result[pref.trigger_type] = pref.is_active;
      }
    }
    return result;
  }

  protected async savePreferences(
    channelUserId: string,
    selections: Record<string, boolean>
  ): Promise<void> {
    const preferences = NOTIFICATION_TYPES.map(t => ({
      trigger_type: t.id,
      is_active: selections[t.id] ?? true,
    }));
    await this.subscriptionApi.saveNotificationPreferences(
      this.platform,
      channelUserId,
      preferences
    );
  }
}
