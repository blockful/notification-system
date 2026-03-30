import { NOTIFICATION_TYPES, NotificationTypeId } from '@notification-system/messages';
import { BaseSettingsService } from './base-settings.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { ContextWithSession } from '../../interfaces/bot.interface';

export class TelegramSettingsService extends BaseSettingsService {
  constructor(subscriptionApi: SubscriptionAPIService) {
    super(subscriptionApi, 'telegram');
  }

  async initialize(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    try {
      const preferences = await this.loadPreferences(String(chatId));
      if (!ctx.session) {
        ctx.session = { daoSelections: new Set<string>() };
      }
      ctx.session.notificationSelections = preferences;

      const keyboard = this.buildKeyboard(preferences);
      await ctx.reply('⚙️ Notification Settings\n\nChoose which notifications you want to receive:', {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      await ctx.reply('Sorry, there was an error loading your settings. Please try again later.');
    }
  }

  async toggle(ctx: ContextWithSession, triggerId: string): Promise<void> {
    if (!ctx.session?.notificationSelections) return;

    ctx.session.notificationSelections[triggerId] = !ctx.session.notificationSelections[triggerId];

    const keyboard = this.buildKeyboard(ctx.session.notificationSelections);
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
    } catch (error) {
      console.error('Error updating settings keyboard:', error);
    }
  }

  async confirm(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId || !ctx.session?.notificationSelections) return;

    try {
      await this.savePreferences(String(chatId), ctx.session.notificationSelections);
      await ctx.editMessageText('✅ Your notification preferences have been saved!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      await ctx.editMessageText('❌ Failed to save your preferences. Please try again.');
    }
  }

  private buildKeyboard(selections: Record<NotificationTypeId, boolean>) {
    const rows: Array<Array<{ text: string; callback_data: string }>> = [];

    // 1 button per row for full-width display
    const notificationTypeIds = Object.values(NotificationTypeId);
    for (const id of notificationTypeIds) {
      const prefix = selections[id] ? '✅' : '❌';
      rows.push([{
        text: `${prefix} ${NOTIFICATION_TYPES[id]}`,
        callback_data: `settings_toggle_${id}`
      }]);
    }

    // Save button
    rows.push([{ text: '💾 Save', callback_data: 'settings_confirm' }]);

    return rows;
  }
}
