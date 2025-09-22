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
  SlackViewContext
} from '../../interfaces/slack-context.interface';

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
          text: 'Sorry, there was an error. Please try again later.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * List user's current wallets
   */
  async listWallets(context: SlackCommandContext): Promise<void> {
    const userId = context.body.user_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${userId}`;

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: "You haven't added any wallets yet. Use `/dao-notify wallet add` to get started!",
            response_type: 'ephemeral'
          });
        }
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
                text: '*Your Wallet Addresses:*'
              }
            },
            {
              type: 'divider'
            },
            ...walletBlocks,
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: 'Use `/dao-notify wallet add` or `/dao-notify wallet remove` to manage your wallets'
                }
              ]
            }
          ],
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error listing wallets:', error);
      if (context.respond) {
        await context.respond({
          text: 'Sorry, there was an error loading your wallets. Please try again later.',
          response_type: 'ephemeral'
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
              text: '*Add a Wallet Address*\n\nTo add a wallet, use the command with your address or ENS name:'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '```/dao-notify wallet add 0x1234...abcd```\nor\n```/dao-notify wallet add vitalik.eth```'
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '💡 Your wallet address will be kept private'
              }
            ]
          }
        ],
        response_type: 'ephemeral'
      });
    }
  }

  /**
   * Process wallet addition from inline command
   */
  async processInlineWalletAdd(context: SlackCommandContext, walletAddress: string): Promise<void> {
    const userId = context.body.user_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${userId}`;

    try {
      // Use base service for validation and addition
      const result = await this.addUserWallet(fullUserId, walletAddress, 'slack');

      if (!result.success) {
        if (context.respond) {
          await context.respond({
            text: `❌ ${result.message}`,
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Get display name for the added address
      const displayName = await this.ensResolver.resolveDisplayName(result.address!);

      if (context.respond) {
        await context.respond({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Wallet added successfully!*\n${displayName}`
              }
            }
          ],
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      if (context.respond) {
        await context.respond({
          text: '❌ An error occurred while adding the wallet. Please try again.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * Start the remove wallet flow
   */
  async startRemoveWallet(context: SlackCommandContext): Promise<void> {
    const userId = context.body.user_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${userId}`;

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: "You don't have any wallets to remove.",
            response_type: 'ephemeral'
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
          text: 'Select the wallets you want to remove:',
          blocks,
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error starting wallet removal:', error);
      if (context.respond) {
        await context.respond({
          text: 'Sorry, there was an error. Please try again later.',
          response_type: 'ephemeral'
        });
      }
    }
  }


  /**
   * Toggle wallet selection for removal
   */
  async toggleWalletForRemoval(context: SlackActionContext, address: string): Promise<void> {
    const userId = context.body.user.id;
    const workspaceId = (context.body as any).team?.id || (context.body as any).user?.team_id;
    const fullUserId = `${workspaceId}:${userId}`;

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
          text: 'Select the wallets you want to remove:',
          blocks
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
    const userId = context.body.user.id;
    const workspaceId = (context.body as any).team?.id || (context.body as any).user?.team_id;
    const fullUserId = `${workspaceId}:${userId}`;

    try {
      await context.ack();

      const walletsToRemove = context.session.walletsToRemove;

      if (!walletsToRemove || walletsToRemove.size === 0) {
        if (context.respond) {
          await context.respond({
            replace_original: true,
            text: '⚠️ Please select at least one wallet to remove.',
            response_type: 'ephemeral'
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
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: result.success
                  ? `✅ *Success!* ${result.message}`
                  : `❌ ${result.message}`
              }
            }
          ]
        });
      }

      // Clear session
      context.session.walletsToRemove = new Set<string>();
    } catch (error) {
      console.error('Error removing wallets:', error);
      if (context.respond) {
        await context.respond({
          replace_original: true,
          text: '❌ Sorry, there was an error removing your wallets. Please try again later.',
          response_type: 'ephemeral'
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
          text: '*Select wallets to remove:*'
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
            text: isSelected ? 'Selected' : 'Select',
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
              text: '🗑️ Confirm Removal',
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