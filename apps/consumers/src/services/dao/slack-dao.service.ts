/**
 * Slack-specific implementation of DAO service.
 * Handles only Slack UI/interaction logic using Block Kit.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { SlackCommandContext, SlackActionContext } from '../../interfaces/slack-context.interface';
import { slackMessages, replacePlaceholders } from '@notification-system/messages';
import type { ViewStateSelectedOption } from '@slack/bolt';
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
  async initialize(context: SlackCommandContext | SlackActionContext): Promise<void> {
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

      const blocks = daoSelectionList(
        daos,
        currentSelections,
        'dao_checkboxes',
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
   * Select all DAOs - re-render checkboxes with all selected
   */
  async selectAll(context: SlackActionContext): Promise<void> {
    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();
      const allSelected = new Set(daos.map(dao => dao.id.toUpperCase()));

      const blocks = daoSelectionList(
        daos,
        allSelected,
        'dao_checkboxes',
        'dao_confirm_subscribe',
        slackMessages.dao.subscribeInstructions
      );

      if (context.respond) {
        await context.respond({
          blocks,
          response_type: 'in_channel',
          replace_original: true
        });
      }
    } catch (error) {
      console.error('Error selecting all DAOs:', error);
    }
  }

  /**
   * Unselect all DAOs - re-render checkboxes with none selected
   */
  async unselectAll(context: SlackActionContext): Promise<void> {
    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();

      const blocks = daoSelectionList(
        daos,
        new Set(),
        'dao_checkboxes',
        'dao_confirm_subscribe',
        slackMessages.dao.subscribeInstructions
      );

      if (context.respond) {
        await context.respond({
          blocks,
          response_type: 'in_channel',
          replace_original: true
        });
      }
    } catch (error) {
      console.error('Error unselecting all DAOs:', error);
    }
  }

  /**
   * Confirm DAO selection changes from checkboxes
   */
  async confirm(context: SlackActionContext): Promise<void> {
    const channelId = context.body.channel?.id;
    const workspaceId = context.body.team?.id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      // Extract selected DAOs from checkbox state
      const state = context.body.state;
      if (typeof state === 'string') {
        throw new Error('Unexpected DialogAction state format');
      }

      const selectedOptions: ViewStateSelectedOption[] =
        state?.values?.dao_checkboxes_block?.dao_checkboxes?.selected_options || [];
      const selectedDAOs = new Set<string>(selectedOptions.map(opt => opt.value));

      // Sync to the complete desired state (handles both adds and removes)
      await this.syncSubscriptionsToState(fullUserId, selectedDAOs);

      // Show confirmation message
      let successMessage: string;
      if (selectedDAOs.size === 0) {
        successMessage = slackMessages.dao.unsubscribeAllSuccess;
      } else {
        const daoList = this.formatDAOList(selectedDAOs);
        successMessage = replacePlaceholders(slackMessages.dao.subscribeSuccess, { daoList });
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