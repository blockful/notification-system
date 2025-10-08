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
   */
  async initialize(context: SlackCommandContext, action: 'add' | 'remove' | 'list', walletAddress?: string): Promise<void> {
    try {
      await context.ack();

      if (action === 'list') {
        await this.listWallets(context);
        return;
      }

      if (action === 'add') {
        // If wallet address provided, add directly
        if (walletAddress) {
          await this.processInlineWalletAdd(context, walletAddress);
        } else {
          await this.showAddWalletHelp(context);
        }
      } else {
        await this.startRemoveWallet(context);
      }
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
  async listWallets(context: SlackCommandContext): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0 && context.respond) {
        await context.respond({
          blocks: walletEmptyState(),
          response_type: 'in_channel'
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
          response_type: 'in_channel'
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
   * Show help message for adding wallet
   */
  async showAddWalletHelp(context: SlackCommandContext): Promise<void> {
    if (context.respond) {
      await context.respond({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: slackMessages.wallet.addInstructions
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: slackMessages.wallet.addExamples
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
        ],
        response_type: 'in_channel'
      });
    }
  }

  /**
   * Start the add wallet flow (conversational)
   */
  async startAddWallet(context: SlackActionContext): Promise<void> {
    try {
      await context.ack();

      // Set session state
      if (!context.session.awaitingInput) {
        context.session.awaitingInput = { type: 'wallet', action: 'add' };
      }

      if (context.respond) {
        await context.respond({
          replace_original: false,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: slackMessages.wallet.inputPrompt
              }
            }
          ],
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      console.error('Error starting add wallet flow:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.genericError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Process wallet addition from inline command
   */
  async processInlineWalletAdd(context: SlackCommandContext, walletAddress: string): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      // Use base service for validation and addition
      const result = await this.addUserWallet(fullUserId, walletAddress, 'slack');

      if (!result.success && context.respond) {
        await context.respond({
          blocks: errorMessage(result.message),
          response_type: 'in_channel'
        });
        return;
      }

      // Get display name for the added address
      const displayName = await this.ensResolver.resolveDisplayName(result.address!);

      if (context.respond) {
        await context.respond({
          blocks: successMessage(replacePlaceholders(slackMessages.wallet.addSuccess, { displayName })),
          response_type: 'in_channel'
        });
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.addError,
          response_type: 'in_channel'
        });
      }
    }
  }

  /**
   * Process wallet input from user message (conversational flow)
   */
  async processWalletInput(context: SlackMessageableContext, walletAddress: string): Promise<void> {
    const channelId = context.body.channel;
    const workspaceId = context.body.team;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      // Use base service for validation and addition
      const result = await this.addUserWallet(fullUserId, walletAddress, 'slack');

      if (!result.success) {
        if (context.say) {
          await context.say({
            blocks: errorMessage(result.message)
          });
        }
        // Reset session state even on error
        context.session.awaitingInput = undefined;
        return;
      }

      // Get display name for the added address
      const displayName = await this.ensResolver.resolveDisplayName(result.address!);

      if (context.say) {
        await context.say({
          blocks: successMessage(replacePlaceholders(slackMessages.wallet.addSuccess, { displayName }))
        });
      }

      // Reset session state
      context.session.awaitingInput = undefined;
    } catch (error) {
      console.error('Error processing wallet input:', error);
      if (context.say) {
        await context.say({
          text: slackMessages.wallet.addError
        });
      }
      // Reset session state on error
      context.session.awaitingInput = undefined;
    }
  }

  /**
   * Start the remove wallet flow
   */
  async startRemoveWallet(context: SlackCommandContext | SlackActionContext): Promise<void> {
    const channelId = (context.body as any).channel?.id || (context.body as any).channel_id;
    const workspaceId = (context.body as any).team?.id || (context.body as any).team_id || (context.body as any).user?.team_id;
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
          response_type: 'in_channel'
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