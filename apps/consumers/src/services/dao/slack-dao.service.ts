/**
 * Slack-specific implementation of DAO service.
 * Handles only Slack UI/interaction logic using Block Kit.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { SlackCommandContext, SlackActionContext } from '../../interfaces/slack-context.interface';

export class SlackDAOService extends BaseDAOService {

  /**
   * Platform identifier for Slack
   */
  protected getPlatformId(): string {
    return 'slack';
  }

  /**
   * Initialize DAO selection interface with Block Kit UI
   */
  async initialize(context: SlackCommandContext, action: 'subscribe' | 'unsubscribe' = 'subscribe'): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();
      if (daos.length === 0) {
        if (context.respond) {
          await context.respond({
            text: 'No DAOs available at the moment. Please try again later.',
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Get user's current subscriptions
      const userPreferences = await this.getUserSubscriptions(fullUserId);
      const currentSelections = new Set<string>(userPreferences);

      // For subscribe action, start with current subscriptions
      // For unsubscribe action, start with empty selection
      context.session.daoSelections = action === 'subscribe'
        ? currentSelections
        : new Set<string>();

      // Store action in session for later use
      context.session.daoAction = action;

      // Build Block Kit message
      const blocks = this.buildDaoSelectionBlocks(daos, context.session.daoSelections, action);

      if (context.respond) {
        await context.respond({
          text: action === 'subscribe'
            ? 'Select the DAOs you want to track:'
            : 'Select the DAOs you want to unsubscribe from:',
          blocks,
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error loading DAOs:', error);
      if (context.respond) {
        await context.respond({
          text: 'Sorry, there was an error loading the DAOs. Please try again later.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * List user's current DAO subscriptions
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
            text: "You're not subscribed to any DAOs yet. Use `/dao-notify subscribe` to get started!",
            response_type: 'ephemeral'
          });
        }
        return;
      }

      const daoList = this.formatDAOListWithBullets(userPreferences);

      if (context.respond) {
        await context.respond({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Your DAO Subscriptions:*\n' + daoList
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'Use `/dao-notify subscribe` to add more or `/dao-notify unsubscribe` to remove'
                }
              ]
            }
          ],
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      if (context.respond) {
        await context.respond({
          text: 'Sorry, there was an error loading your subscriptions. Please try again later.',
          response_type: 'ephemeral'
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

      // Toggle selection in session
      if (context.session.daoSelections.has(normalizedDaoName)) {
        context.session.daoSelections.delete(normalizedDaoName);
      } else {
        context.session.daoSelections.add(normalizedDaoName);
      }

      // Get action from session or infer from button callback
      const action = context.session.daoAction ||
        (context.body.actions[0].action_id?.includes('unsubscribe')
          ? 'unsubscribe'
          : 'subscribe');

      // Update the message with new selection state
      const daos = await this.fetchAvailableDAOs();
      const blocks = this.buildDaoSelectionBlocks(daos, context.session.daoSelections, action);

      if (context.respond) {
        await context.respond({
          replace_original: true,
          text: action === 'subscribe'
            ? 'Select the DAOs you want to track:'
            : 'Select the DAOs you want to unsubscribe from:',
          blocks
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

      const selectedDAOs = context.session.daoSelections;

      if (!selectedDAOs || selectedDAOs.size === 0) {
        if (context.respond) {
          await context.respond({
            replace_original: true,
            text: action === 'subscribe'
              ? '⚠️ Please select at least one DAO to subscribe to.'
              : '⚠️ Please select at least one DAO to unsubscribe from.',
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Apply the subscription action to selected DAOs
      await this.applySubscriptionAction(fullUserId, selectedDAOs, action);

      // Show confirmation message
      const daoList = this.formatDAOList(selectedDAOs);

      if (context.respond) {
        await context.respond({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: action === 'subscribe'
                  ? `✅ *Success!* You're now tracking: ${daoList}`
                  : `✅ *Success!* You've unsubscribed from: ${daoList}`
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'You can update your subscriptions anytime with `/dao-notify`'
                }
              ]
            }
          ]
        });
      }

      // Clear session
      context.session.daoSelections = new Set<string>();
      context.session.daoAction = undefined;
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      if (context.respond) {
        await context.respond({
          replace_original: true,
          text: '❌ Sorry, there was an error updating your subscriptions. Please try again later.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * Build Block Kit blocks for DAO selection
   */
  private buildDaoSelectionBlocks(daos: any[], selections: Set<string>, action: 'subscribe' | 'unsubscribe'): any[] {
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: action === 'subscribe'
            ? '*Select the DAOs you want to track:*'
            : '*Select the DAOs you want to unsubscribe from:*'
        }
      },
      {
        type: 'divider'
      }
    ];

    // Add DAO selection buttons
    for (const dao of daos) {
      const normalizedDao = dao.id.toUpperCase();
      const isSelected = selections.has(normalizedDao);
      const daoWithEmoji = this.getDaoWithEmoji(dao.id);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${isSelected ? '☑️' : '☐'} *${daoWithEmoji}*`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: isSelected ? 'Selected' : 'Select',
            emoji: true
          },
          style: isSelected ? 'primary' : undefined,
          action_id: `dao_toggle_${action}_${normalizedDao}`,
          value: normalizedDao
        }
      });
    }

    // Add confirm button
    blocks.push(
      {
        type: 'divider'
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Confirm Selection',
              emoji: true
            },
            style: 'primary',
            action_id: `dao_confirm_${action}`
          }
        ]
      }
    );

    return blocks;
  }
}