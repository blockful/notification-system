/**
 * Slack-specific implementation of DAO service.
 * Handles only Slack UI/interaction logic using Block Kit.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { SlackCommandContext, SlackActionContext } from '../../interfaces/slack-context.interface';
import { getDaoWithEmoji, slackMessages, uiMessages, replacePlaceholders } from '@notification-system/messages';

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
    const userId = context.body.user_id;

    try {
      await context.ack();

      const daos = await this.fetchAvailableDAOs();
      if (daos.length === 0) {
        if (context.respond) {
          await context.respond({
            text: uiMessages.errors.noDaosAvailable,
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Get user's current subscriptions
      const userPreferences = await this.getUserSubscriptions(userId);
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
            ? slackMessages.dao.subscribeInstructions
            : slackMessages.dao.unsubscribeInstructions,
          blocks,
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error loading DAOs:', error);
      if (context.respond) {
        await context.respond({
          text: uiMessages.errors.loadingDaos,
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * List user's current DAO subscriptions
   */
  async listSubscriptions(context: SlackCommandContext): Promise<void> {
    const userId = context.body.user_id;

    try {
      await context.ack();

      const userPreferences = await this.getUserSubscriptions(userId);

      if (userPreferences.length === 0) {
        if (context.respond) {
          await context.respond({
            text: slackMessages.dao.emptyList,
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
                text: slackMessages.dao.listHeader + '\n' + daoList
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: slackMessages.dao.instructions
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
          text: uiMessages.errors.loadingSubscriptions,
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * Toggle DAO selection when user clicks a button
   */
  async toggle(context: SlackActionContext, daoName: string): Promise<void> {
    const userId = context.body.user.id;

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
        ((context.body as any).actions?.[0]?.action_id?.includes('unsubscribe')
          ? 'unsubscribe'
          : 'subscribe');

      // Update the message with new selection state
      const daos = await this.fetchAvailableDAOs();
      const blocks = this.buildDaoSelectionBlocks(daos, context.session.daoSelections, action);

      if (context.respond) {
        await context.respond({
          replace_original: true,
          text: action === 'subscribe'
            ? slackMessages.dao.subscribeInstructions
            : slackMessages.dao.unsubscribeInstructions,
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
    const userId = context.body.user.id;

    try {
      await context.ack();

      const selectedDAOs = context.session.daoSelections;

      if (!selectedDAOs || selectedDAOs.size === 0) {
        if (context.respond) {
          await context.respond({
            replace_original: true,
            text: action === 'subscribe'
              ? slackMessages.dao.subscribeWarning
              : slackMessages.dao.unsubscribeWarning,
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Apply the subscription action to selected DAOs
      await this.applySubscriptionAction(userId, selectedDAOs, action);

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
                  ? replacePlaceholders(slackMessages.dao.subscribeSuccess, { daoList })
                  : replacePlaceholders(slackMessages.dao.unsubscribeSuccess, { daoList })
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
          text: `${uiMessages.status.error} ${uiMessages.errors.updateSubscriptionsFailed}`,
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
            ? slackMessages.dao.subscribeHeader
            : slackMessages.dao.unsubscribeHeader
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
      const daoWithEmoji = getDaoWithEmoji(dao.id);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${isSelected ? uiMessages.selection.checked : uiMessages.selection.unchecked} *${daoWithEmoji}*`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: isSelected ? uiMessages.selection.selected : uiMessages.selection.select,
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
              text: slackMessages.dao.confirmButton,
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