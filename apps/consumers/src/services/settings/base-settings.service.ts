import { NotificationTypeId } from '@notification-system/messages';
import { SubscriptionAPIService } from '../subscription-api.service';
import { createLogger, type Logger } from '@anticapture/observability';

export abstract class BaseSettingsService {
  protected readonly logger: Logger;

  constructor(
    protected subscriptionApi: SubscriptionAPIService,
    protected platform: string,
    logger: Logger = createLogger('consumers'),
  ) {
    this.logger = logger.child({ component: `${platform}-settings` });
  }

  protected async loadPreferences(channelUserId: string): Promise<Record<NotificationTypeId, boolean>> {
    const stored = await this.subscriptionApi.getNotificationPreferences(
      this.platform,
      channelUserId
    );
    const result = {} as Record<NotificationTypeId, boolean>;
    for (const id of Object.values(NotificationTypeId)) {
      result[id] = true; // default: enabled
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
    selections: Record<NotificationTypeId, boolean>
  ): Promise<void> {
    const preferences = Object.values(NotificationTypeId).map(id => ({
      trigger_type: id,
      is_active: selections[id] ?? true,
    }));
    await this.subscriptionApi.saveNotificationPreferences(
      this.platform,
      channelUserId,
      preferences
    );
  }
}
