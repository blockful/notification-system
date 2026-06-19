import { NOTIFICATION_TYPES, NotificationTypeId } from '@notification-system/messages';
import type { KnownBlock } from '@slack/web-api';
import { BaseSettingsService } from './base-settings.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { SlackActionContext } from '../../interfaces/slack-context.interface';
import { createLogger, type Logger } from '@anticapture/observability';

export class SlackSettingsService extends BaseSettingsService {
  constructor(subscriptionApi: SubscriptionAPIService, logger: Logger = createLogger('consumers')) {
    super(subscriptionApi, 'slack', logger);
  }

  /**
   * Settings UI as a list of rows — one notification type per row with a toggle
   * button on the right (✅ On / Off). Each button is a per-row toggle (action_id
   * `settings_toggle_<id>`, id in `value`) that saves immediately on click. Rows
   * are `section` blocks with a `button` accessory; 12 types → ~17 blocks, well
   * under the 50-block message limit. (Checkboxes cap at 10 and a multi-select is
   * a dropdown, so neither gives a friendly, fully-visible list — buttons do.)
   */
  private buildSettingsBlocks(preferences: Record<NotificationTypeId, boolean>): KnownBlock[] {
    const rows = Object.values(NotificationTypeId).map((id) => ({
      type: 'section' as const,
      text: { type: 'mrkdwn' as const, text: NOTIFICATION_TYPES[id] },
      accessory: {
        type: 'button' as const,
        text: { type: 'plain_text' as const, text: preferences[id] ? '✅ On' : 'Off', emoji: true },
        action_id: `settings_toggle_${id}`,
        value: id,
        ...(preferences[id] ? { style: 'primary' as const } : {}),
      },
    }));

    return [
      { type: 'header' as const, text: { type: 'plain_text' as const, text: '⚙️ Notification Settings' } },
      { type: 'section' as const, text: { type: 'mrkdwn' as const, text: 'Toggle the notifications you want to receive — changes save instantly.' } },
      { type: 'divider' as const },
      ...rows,
      { type: 'divider' as const },
      {
        type: 'actions' as const,
        elements: [{
          type: 'button' as const,
          text: { type: 'plain_text' as const, text: '✅ Done' },
          action_id: 'settings_confirm',
          style: 'primary' as const,
        }],
      },
    ];
  }

  async initialize(ctx: SlackActionContext): Promise<void> {
    const channelId = ctx.body.channel?.id || ctx.body.channel_id;
    const workspaceId = ctx.body.team?.id || ctx.body.team_id || ctx.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await ctx.ack();

      const preferences = await this.loadPreferences(fullUserId);
      ctx.session.notificationSelections = preferences;

      if (ctx.respond) {
        await ctx.respond({
          blocks: this.buildSettingsBlocks(preferences),
          text: 'Notification Settings',
          response_type: 'in_channel',
          replace_original: false,
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'settings.load_failed' }, 'error loading notification settings');
      if (ctx.respond) {
        await ctx.respond({
          text: 'Sorry, there was an error loading your settings. Please try again later.',
          response_type: 'ephemeral',
        });
      }
    }
  }

  /**
   * Toggle a single notification type on/off, persist it, and re-render in place.
   * Option 3 UI: each type is a row whose button saves immediately on click.
   */
  async toggle(ctx: SlackActionContext, typeId: string): Promise<void> {
    const channelId = ctx.body.channel?.id || ctx.body.channel_id;
    const workspaceId = ctx.body.team?.id || ctx.body.team_id || ctx.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await ctx.ack();

      const id = typeId as NotificationTypeId;
      const preferences = await this.loadPreferences(fullUserId);
      preferences[id] = !preferences[id];
      await this.savePreferences(fullUserId, preferences);
      ctx.session.notificationSelections = preferences;

      if (ctx.respond) {
        await ctx.respond({
          blocks: this.buildSettingsBlocks(preferences),
          text: 'Notification Settings',
          response_type: 'in_channel',
          replace_original: true,
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'settings.toggle_failed' }, 'error toggling notification setting');
      if (ctx.respond) {
        await ctx.respond({
          text: '❌ Failed to update your settings. Please try again.',
          response_type: 'ephemeral',
        });
      }
    }
  }

  /**
   * "Done" button. Preferences were already saved per-click via toggle(), so this
   * only collapses the list into a final summary.
   */
  async confirm(ctx: SlackActionContext): Promise<void> {
    const channelId = ctx.body.channel?.id || ctx.body.channel_id;
    const workspaceId = ctx.body.team?.id || ctx.body.team_id || ctx.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await ctx.ack();

      const preferences = await this.loadPreferences(fullUserId);
      const enabled = Object.values(NotificationTypeId)
        .filter(id => preferences[id])
        .map(id => NOTIFICATION_TYPES[id]);

      const summary = enabled.length === 0
        ? '🔕 All notifications are turned off.'
        : `✅ You'll receive: ${enabled.join(', ')}.`;

      if (ctx.respond) {
        await ctx.respond({
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: summary } }],
          text: 'Notification settings saved',
          response_type: 'in_channel',
          replace_original: true,
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'settings.save_failed' }, 'error finalizing notification settings');
      if (ctx.respond) {
        await ctx.respond({
          text: '❌ Something went wrong. Please try again.',
          response_type: 'ephemeral',
        });
      }
    }
  }
}
