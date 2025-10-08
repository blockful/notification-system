/**
 * Slack-specific implementation of DAO service.
 * Handles only Slack UI/interaction logic using Block Kit.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { SlackCommandContext, SlackActionContext } from '../../interfaces/slack-context.interface';
import { slackMessages, replacePlaceholders } from '@notification-system/messages';
import {
  daoSelectionList,
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
  async initialize(context: SlackCommandContext, action: 'subscribe' | 'unsubscribe' = 'subscribe'): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
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

      // Get user's current subscriptions and initialize session
      const userPreferences = await this.getUserSubscriptions(fullUserId);
      const currentSelections = action === 'subscribe' ? new Set(userPreferences) : new Set<string>();

      if (!context.session) context.session = {};
      context.session.daoAction = action;
      context.session.daoSelections = currentSelections;

      const blocks = daoSelectionList(
        daos,
        currentSelections,
        `dao_toggle_${action}`,
        `dao_confirm_${action}`,
        action === 'subscribe' ? slackMessages.dao.subscribeInstructions : slackMessages.dao.unsubscribeInstructions
      );

      if (context.respond) {
        await context.respond({ blocks, response_type: 'in_channel' });
      }
    } catch (error) {
      console.error('Error loading DAOs:', error);
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
            response_type: 'in_channel'
          });
        }
        return;
      }

      const daoList = this.formatDAOListWithBullets(userPreferences);

      if (context.respond) {
        await context.respond({
          blocks: daoListWithEdit(daoList),
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.dao.listError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Toggle DAO selection when user clicks a button
   */
  async toggle(context: SlackActionContext, daoName: string): Promise<void> {
    try {
      await context.ack();

      const normalizedDaoName = daoName.toUpperCase();

      // Toggle DAO in session
      if (!context.session) context.session = {};
      if (!context.session.daoSelections) context.session.daoSelections = new Set();

      if (context.session.daoSelections.has(normalizedDaoName)) {
        context.session.daoSelections.delete(normalizedDaoName);
      } else {
        context.session.daoSelections.add(normalizedDaoName);
      }

      const action = context.session.daoAction ||
        (context.body.actions[0].action_id?.includes('unsubscribe') ? 'unsubscribe' : 'subscribe');

      const daos = await this.fetchAvailableDAOs();
      const blocks = daoSelectionList(
        daos,
        context.session.daoSelections || new Set(),
        `dao_toggle_${action}`,
        `dao_confirm_${action}`,
        action === 'subscribe' ? slackMessages.dao.subscribeHeader : slackMessages.dao.unsubscribeHeader
      );

      if (context.respond) {
        await context.respond({
          replace_original: true,
          blocks,
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  }

  /**
   * Confirm DAO selection changes
   */
  async confirm(context: SlackActionContext, action: 'subscribe' | 'unsubscribe'): Promise<void> {
    const channelId = context.body.channel?.id;
    const workspaceId = context.body.team?.id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const selectedDAOs = context.session.daoSelections || new Set<string>();

      // Apply the subscription action to selected DAOs
      if (action === 'subscribe') {
        // For subscribe, sync to the complete desired state (handles both adds and removes)
        await this.syncSubscriptionsToState(fullUserId, selectedDAOs);
      } else {
        // For unsubscribe, just remove the selected DAOs
        await this.applySubscriptionAction(fullUserId, selectedDAOs, 'unsubscribe');
      }

      // Show confirmation message
      let successMessage: string;
      if (selectedDAOs.size === 0) {
        successMessage = action === 'subscribe'
          ? '✅ *Success!* You\'ve unsubscribed from all DAOs.'
          : '✅ *Success!* No changes were made.';
      } else {
        const daoList = this.formatDAOList(selectedDAOs);
        successMessage = action === 'subscribe'
          ? replacePlaceholders(slackMessages.dao.subscribeSuccess, { daoList })
          : replacePlaceholders(slackMessages.dao.unsubscribeSuccess, { daoList });
      }

      if (context.respond) {
        await context.respond({
          replace_original: false,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: successMessage
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: slackMessages.dao.updateInstructions
                }
              ]
            }
          ],
          response_type: 'in_channel'
        });
      }

      // Clear session
      context.session.daoSelections = new Set<string>();
      context.session.daoAction = undefined;
    } catch (error) {
      console.error('Error updating subscriptions:', error);
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