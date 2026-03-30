import { NOTIFICATION_TYPES, NotificationTypeId } from '@notification-system/messages';
import { BaseSettingsService } from './base-settings.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { SlackActionContext } from '../../interfaces/slack-context.interface';

export class SlackSettingsService extends BaseSettingsService {
  constructor(subscriptionApi: SubscriptionAPIService) {
    super(subscriptionApi, 'slack');
  }

  async initialize(ctx: SlackActionContext): Promise<void> {
    const channelId = ctx.body.channel?.id || ctx.body.channel_id;
    const workspaceId = ctx.body.team?.id || ctx.body.team_id || ctx.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await ctx.ack();

      const preferences = await this.loadPreferences(fullUserId);
      ctx.session.notificationSelections = preferences;

      const notificationTypeIds = Object.values(NotificationTypeId);
      const options = notificationTypeIds.map(id => ({
        text: { type: 'plain_text' as const, text: NOTIFICATION_TYPES[id] },
        value: id,
      }));

      const initialOptions = notificationTypeIds
        .filter(id => preferences[id])
        .map(id => ({
          text: { type: 'plain_text' as const, text: NOTIFICATION_TYPES[id] },
          value: id,
        }));

      const blocks = [
        {
          type: 'header' as const,
          text: { type: 'plain_text' as const, text: '⚙️ Notification Settings' }
        },
        {
          type: 'section' as const,
          text: { type: 'mrkdwn' as const, text: 'Choose which notifications you want to receive:' }
        },
        {
          type: 'actions' as const,
          block_id: 'settings_checkboxes_block',
          elements: [{
            type: 'checkboxes' as const,
            action_id: 'settings_checkboxes',
            options,
            ...(initialOptions.length > 0 ? { initial_options: initialOptions } : {})
          }]
        },
        {
          type: 'actions' as const,
          elements: [{
            type: 'button' as const,
            text: { type: 'plain_text' as const, text: '✅ Save Settings' },
            action_id: 'settings_confirm',
            style: 'primary' as const
          }]
        }
      ];

      if (ctx.respond) {
        await ctx.respond({
          blocks,
          text: 'Notification Settings',
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      if (ctx.respond) {
        await ctx.respond({
          text: 'Sorry, there was an error loading your settings. Please try again later.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  async confirm(ctx: SlackActionContext): Promise<void> {
    const channelId = ctx.body.channel?.id || ctx.body.channel_id;
    const workspaceId = ctx.body.team?.id || ctx.body.team_id || ctx.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await ctx.ack();

      // Extract selected checkbox values from state
      const stateValues = typeof ctx.body.state === 'object' ? ctx.body.state?.values : undefined;
      const selectedValues = new Set<string>();

      if (stateValues) {
        const checkboxBlock = stateValues['settings_checkboxes_block'];
        if (checkboxBlock?.['settings_checkboxes']) {
          const selectedOptions = checkboxBlock['settings_checkboxes'].selected_options || [];
          for (const option of selectedOptions) {
            if (option.value) {
              selectedValues.add(option.value);
            }
          }
        }
      }

      // Build selections record: selected = true, unselected = false
      const selections = {} as Record<NotificationTypeId, boolean>;
      for (const id of Object.values(NotificationTypeId)) {
        selections[id] = selectedValues.has(id);
      }

      await this.savePreferences(fullUserId, selections);

      if (ctx.respond) {
        await ctx.respond({
          text: '✅ Your notification preferences have been saved!',
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      if (ctx.respond) {
        await ctx.respond({
          text: '❌ Failed to save your preferences. Please try again.',
          response_type: 'ephemeral'
        });
      }
    }
  }
}
