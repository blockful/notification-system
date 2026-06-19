/**
 * Slack-specific implementation of DAO service.
 * Handles only Slack UI/interaction logic using Block Kit.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { SlackCommandContext, SlackActionContext } from '../../interfaces/slack-context.interface';

export type SlackDAORequest = Pick<SlackActionContext, 'body' | 'session' | 'ack' | 'respond'>;
import { slackMessages, replacePlaceholders } from '@notification-system/messages';
import {
  daoToggleList,
  errorMessage,
  daoEmptyState,
  daoListWithEdit
} from '../../utils/slack-blocks-templates';

export class SlackDAOService extends BaseDAOService {

  /**
   * Platform identifier for Slack
   */
  protected getPlatformId(): string {
    return 'slack';
  }

  /**
   * Initialize DAO selection interface
   */
  async initialize(context: SlackDAORequest): Promise<void> {
    const channelId = context.body.channel?.id || context.body.channel_id;
    const workspaceId = context.body.team?.id || context.body.team_id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();
      if (daos.length === 0 && context.respond) {
        await context.respond({
          text: slackMessages.dao.noDaosAvailable,
          response_type: 'in_channel'
        });
        return;
      }

      // Get user's current subscriptions for initial checkbox state
      const userPreferences = await this.getUserSubscriptions(fullUserId);
      const currentSelections = new Set(userPreferences);

      const blocks = daoToggleList(
        daos,
        currentSelections,
        'dao_toggle',
        'dao_confirm_subscribe',
        slackMessages.dao.subscribeInstructions
      );

      if (context.respond) {
        await context.respond({
          blocks,
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'dao.load_failed' }, 'error loading DAOs');
      if (context.respond) {
        await context.respond({
          blocks: errorMessage(slackMessages.dao.loadError),
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * List user's current DAO subscriptions with edit button
   */
  async listSubscriptions(context: SlackCommandContext): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const userPreferences = await this.getUserSubscriptions(fullUserId);

      if (userPreferences.length === 0) {
        if (context.respond) {
          await context.respond({
            blocks: daoEmptyState(),
            response_type: 'in_channel',
            replace_original: false
          });
        }
        return;
      }

      const daoList = this.formatDAOListWithBullets(userPreferences);

      if (context.respond) {
        await context.respond({
          blocks: daoListWithEdit(daoList),
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'dao.list_subscriptions_failed' }, 'error listing subscriptions');
      if (context.respond) {
        await context.respond({
          text: slackMessages.dao.listError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Toggle a single DAO subscription on/off, then re-render the list in place.
   * Option 2 UI: each DAO is a button that saves immediately on click — there is
   * no batch "confirm" step for the selection itself.
   */
  async toggle(context: SlackActionContext, daoId: string): Promise<void> {
    const channelId = context.body.channel?.id || context.body.channel_id;
    const workspaceId = context.body.team?.id || context.body.team_id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const normalized = daoId.toUpperCase();
      const daos = await this.fetchAvailableDAOs();
      const current = new Set(
        await this.subscriptionApi.getUserPreferences(fullUserId, this.getPlatformId(), daos.map(dao => dao.id))
      );

      // Flip just the clicked DAO and persist that single change
      const willSubscribe = !current.has(normalized);
      await this.subscriptionApi.saveUserPreference(normalized, fullUserId, this.getPlatformId(), willSubscribe);
      if (willSubscribe) {
        current.add(normalized);
      } else {
        current.delete(normalized);
      }

      if (context.respond) {
        await context.respond({
          blocks: daoToggleList(daos, current, 'dao_toggle', 'dao_confirm_subscribe', slackMessages.dao.subscribeInstructions),
          response_type: 'in_channel',
          replace_original: true
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'dao.toggle_failed' }, 'error toggling DAO subscription');
      if (context.respond) {
        await context.respond({
          text: slackMessages.dao.updateError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * "Done" button. Subscriptions were already saved per-click via toggle(), so
   * this just collapses the button list into a final summary. Onboarding advance
   * (the wallet step) is triggered by the action handler in slack-bot.service.
   */
  async confirm(context: SlackActionContext): Promise<void> {
    const channelId = context.body.channel?.id || context.body.channel_id;
    const workspaceId = context.body.team?.id || context.body.team_id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();
      const current = await this.subscriptionApi.getUserPreferences(fullUserId, this.getPlatformId(), daos.map(dao => dao.id));

      const summaryMessage = current.length === 0
        ? slackMessages.dao.unsubscribeAllSuccess
        : replacePlaceholders(slackMessages.dao.subscribeSuccess, { daoList: this.formatDAOList(current) });

      if (context.respond) {
        await context.respond({
          replace_original: true,
          blocks: [
            { type: 'section', text: { type: 'mrkdwn', text: summaryMessage } },
            { type: 'context', elements: [{ type: 'mrkdwn', text: slackMessages.dao.updateInstructions }] }
          ],
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      this.logger.error({ err: error, event: 'dao.confirm_failed' }, 'error finalizing DAO selection');
      if (context.respond) {
        await context.respond({
          replace_original: false,
          text: slackMessages.dao.updateError,
          response_type: 'in_channel'
        });
      }
    }
  }

}