/**
 * Slack-specific wallet service implementation.
 * Handles UI interactions using Block Kit and modals while delegating
 * business logic to BaseWalletService.
 */

import { BaseWalletService } from './base-wallet.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { EnsResolverService } from '../ens-resolver.service';
import {
  SlackCommandContext,
  SlackActionContext,
  SlackViewContext,
  SlackMessageableContext
} from '../../interfaces/slack-context.interface';
import {
  walletEmptyState,
  successMessage,
  errorMessage
} from '../../utils/slack-blocks-templates';
import { slackMessages, replacePlaceholders } from '@notification-system/messages';

export class SlackWalletService extends BaseWalletService {

  constructor(
    subscriptionApi: SubscriptionAPIService,
    ensResolver: EnsResolverService
  ) {
    super(subscriptionApi, ensResolver);
  }

  /**
   * Display the wallet management interface
   * Always shows list with add/remove buttons
   */
  async initialize(context: SlackCommandContext | SlackActionContext): Promise<void> {
    try {
      await context.ack();
      await this.listWallets(context);
    } catch (error) {
      console.error('Error in wallet initialization:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.genericError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * List user's current wallets
   */
  async listWallets(context: SlackCommandContext | SlackActionContext): Promise<void> {
    const channelId = context.body.channel?.id || context.body.channel_id;
    const workspaceId = context.body.team?.id || context.body.team_id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0 && context.respond) {
        await context.respond({
          blocks: walletEmptyState(),
          response_type: 'in_channel',
          replace_original: false
        });
        return;
      }

      // Build wallet list with display names
      const walletBlocks = wallets.map(wallet => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${wallet.displayName || wallet.address}`
        }
      }));

      if (context.respond) {
        await context.respond({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: slackMessages.wallet.listHeader
              }
            },
            {
              type: 'divider'
            },
            ...walletBlocks,
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
                    text: slackMessages.wallet.buttonAdd,
                    emoji: true
                  },
                  style: 'primary',
                  action_id: 'wallet_add'
                },
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: slackMessages.wallet.buttonRemove,
                    emoji: true
                  },
                  style: 'danger',
                  action_id: 'wallet_remove'
                }
              ]
            }
          ],
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      console.error('Error listing wallets:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.loadError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Start the add wallet flow - opens modal with input
   */
  async startAddWallet(context: SlackActionContext): Promise<void> {
    try {
      const triggerId = context.body.trigger_id;
      const channelId = context.body.channel?.id;

      if (!triggerId) {
        throw new Error('No trigger_id available for modal');
      }

      // Open modal with wallet input
      await (context as any).client.views.open({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'wallet_add_modal',
          private_metadata: channelId,
          title: {
            type: 'plain_text',
            text: 'Add Wallet'
          },
          submit: {
            type: 'plain_text',
            text: 'Add'
          },
          close: {
            type: 'plain_text',
            text: 'Cancel'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'wallet_input_block',
              element: {
                type: 'plain_text_input',
                action_id: 'wallet_address',
                placeholder: {
                  type: 'plain_text',
                  text: '0x1234...abcd or vitalik.eth'
                }
              },
              label: {
                type: 'plain_text',
                text: 'Wallet Address or ENS'
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: slackMessages.wallet.privacyNote
                }
              ]
            }
          ]
        }
      });

      await context.ack();
    } catch (error) {
      console.error('Error opening wallet modal:', error);
      await context.ack();
      if (context.respond) {
        await context.respond({
          text: slackMessages.genericError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Process wallet submission from modal
   */
  async processWalletSubmission(context: SlackViewContext): Promise<void> {
    const workspaceId = context.body.team?.id || context.body.user?.team_id;
    const channelId = context.view.private_metadata || context.body.user?.id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      // Extract wallet address from modal submission
      const values = context.view.state.values;
      const walletAddress = values?.wallet_input_block?.wallet_address?.value;

      if (!walletAddress) {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input_block: 'Wallet address is required'
          }
        });
        return;
      }

      // Use base service for validation and addition
      const result = await this.addUserWallet(fullUserId, walletAddress, 'slack');

      if (!result.success) {
        // Return validation error to modal
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input_block: result.message
          }
        });
        return;
      }

      // Success - close modal
      await context.ack();

      // Get display name for the added address
      const displayName = await this.ensResolver.resolveDisplayName(result.address!);

      // Send success message to channel
      if ((context as any).client) {
        await (context as any).client.chat.postMessage({
          channel: channelId,
          blocks: successMessage(replacePlaceholders(slackMessages.wallet.addSuccess, { displayName }))
        });
      }
    } catch (error) {
      console.error('Error processing wallet submission:', error);
      await context.ack({
        response_action: 'errors',
        errors: {
          wallet_input_block: slackMessages.wallet.addError
        }
      });
    }
  }

  /**
   * Start the remove wallet flow
   */
  async startRemoveWallet(context: SlackCommandContext | SlackActionContext): Promise<void> {
    const channelId = context.body.channel?.id || context.body.channel_id;
    const workspaceId = context.body.team?.id || context.body.team_id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: slackMessages.wallet.noWalletsToRemove,
            response_type: 'in_channel'
          });
        }
        return;
      }

      // Clear previous selections
      context.session.walletsToRemove = new Set<string>();

      // Build blocks with checkboxes for each wallet
      const blocks = await this.buildWalletRemovalBlocks(wallets, context.session.walletsToRemove);

      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.removeInstructions,
          blocks,
          response_type: 'in_channel',
          replace_original: false
        });
      }
    } catch (error) {
      console.error('Error starting wallet removal:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.genericError,
          response_type: 'in_channel'
        });
      }
    }
  }


  /**
   * Toggle wallet selection for removal
   */
  async toggleWalletForRemoval(context: SlackActionContext, address: string): Promise<void> {
    const channelId = context.body.channel?.id;
    const workspaceId = context.body.team?.id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      if (!context.session.walletsToRemove) {
        context.session.walletsToRemove = new Set<string>();
      }

      // Toggle selection
      if (context.session.walletsToRemove.has(address)) {
        context.session.walletsToRemove.delete(address);
      } else {
        context.session.walletsToRemove.add(address);
      }

      // Get current wallets to rebuild blocks
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');
      const blocks = await this.buildWalletRemovalBlocks(wallets, context.session.walletsToRemove);

      if (context.respond) {
        await context.respond({
          replace_original: true,
          text: slackMessages.wallet.removeInstructions,
          blocks,
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      console.error('Error toggling wallet selection:', error);
    }
  }

  /**
   * Confirm wallet removal
   */
  async confirmRemoval(context: SlackActionContext): Promise<void> {
    const channelId = context.body.channel?.id;
    const workspaceId = context.body.team?.id || context.body.user?.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      await context.ack();

      const walletsToRemove = context.session.walletsToRemove;

      if (!walletsToRemove || walletsToRemove.size === 0) {
        if (context.respond) {
          await context.respond({
            replace_original: true,
            text: slackMessages.wallet.removeWarning,
            response_type: 'in_channel'
          });
        }
        return;
      }

      // Use base service for removal
      const result = await this.removeUserWallets(
        fullUserId,
        Array.from(walletsToRemove),
        'slack'
      );

      if (context.respond) {
        await context.respond({
          replace_original: false,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: result.success
                  ? replacePlaceholders(slackMessages.wallet.removeSuccess, { message: result.message })
                  : `❌ ${result.message}`
              }
            }
          ],
          response_type: 'in_channel'
        });
      }

      // Clear session
      context.session.walletsToRemove = new Set<string>();
    } catch (error) {
      console.error('Error removing wallets:', error);
      if (context.respond) {
        await context.respond({
          replace_original: false,
          text: slackMessages.wallet.removeError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Build Block Kit blocks for wallet removal
   */
  private async buildWalletRemovalBlocks(
    wallets: { address: string; displayName?: string }[],
    selections: Set<string>
  ): Promise<any[]> {
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: slackMessages.wallet.removeInstructions
        }
      },
      {
        type: 'divider'
      }
    ];

    // Add wallet checkboxes
    for (const wallet of wallets) {
      const isSelected = selections.has(wallet.address);
      const displayName = wallet.displayName || wallet.address;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${isSelected ? '☑️' : '☐'} ${displayName}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: isSelected ? slackMessages.wallet.buttonSelected : slackMessages.wallet.buttonSelect,
            emoji: true
          },
          style: isSelected ? 'danger' : undefined,
          action_id: `wallet_toggle_${wallet.address}`,
          value: wallet.address
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
              text: slackMessages.wallet.confirmRemoval,
              emoji: true
            },
            style: 'danger',
            action_id: 'wallet_confirm_remove'
          }
        ]
      }
    );

    return blocks;
  }
}