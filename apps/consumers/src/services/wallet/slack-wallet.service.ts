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
          text: 'Sorry, there was an error. Please try again later.',
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
   * Supports adding multiple addresses at once (max 10)
   */
  async processInlineWalletAdd(context: SlackCommandContext, walletAddress: string): Promise<void> {
    const userId = context.body.user_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${userId}`;
    const inputs = walletAddress.trim().split(/\s+/).filter(a => a.length > 0);

    // Validate limit
    if (inputs.length > 10) {
      if (context.respond) {
        await context.respond({
          text: '❌ Maximum 10 addresses per command',
          response_type: 'ephemeral'
        });
      }
      return;
    }

    try {
      const existingWallets = await this.subscriptionApi.getUserWallets(fullUserId, 'slack');
      const existingSet = new Set(existingWallets.map(w => w.address.toLowerCase()));
      const validationPromises = inputs.map(async (input) => ({
        input,
        address: await this.validateAndResolveAddress(input)
      }));
      const validations = await Promise.all(validationPromises);
      const toAdd: string[] = [];
      const invalid: string[] = [];
      const duplicates: string[] = [];

      for (const { input, address } of validations) {
        if (!address) {
          invalid.push(input);
        } else if (existingSet.has(address.toLowerCase())) {
          duplicates.push(input);
        } else {
          toAdd.push(address);
        }
      }

      // Add all valid addresses
      if (toAdd.length > 0) {
        const addPromises = toAdd.map(addr =>
          this.subscriptionApi.addUserWallet(fullUserId, addr, 'slack')
        );

        await Promise.all(addPromises);
      }

      let message = '';
      if (toAdd.length > 0) {
        message += `✅ ${toAdd.length} wallet(s) added successfully\n`;
      }
      if (duplicates.length > 0) {
        message += `⚠️ ${duplicates.length} already exist\n`;
      }
      if (invalid.length > 0) {
        message += `❌ ${invalid.length} invalid: ${invalid.slice(0, 3).join(', ')}`;
        if (invalid.length > 3) {
          message += ` and ${invalid.length - 3} more`;
        }
      }

      if (context.respond) {
        await context.respond({
          text: message || '✅ Done',
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error adding wallet(s):', error);
      if (context.respond) {
        await context.respond({
          text: '❌ An error occurred while adding the wallet(s). Please try again.',
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * Show help message for adding wallet
   */
  async startAddWallet(context: SlackCommandContext): Promise<void> {
    try {
      // Open modal for wallet input
      await context.client.views.open({
        trigger_id: context.body.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'wallet_add_modal',
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
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Enter your wallet address or ENS name to receive custom notifications.'
              }
            },
            {
              type: 'input',
              block_id: 'wallet_input',
              element: {
                type: 'plain_text_input',
                action_id: 'wallet_address',
                placeholder: {
                  type: 'plain_text',
                  text: '0x... or name.eth'
                }
              },
              label: {
                type: 'plain_text',
                text: 'Wallet Address or ENS'
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error adding wallet(s):', error);
      if (context.respond) {
        await context.respond({
          text: '❌ An error occurred while adding the wallet(s). Please try again.',
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
   * Process wallet addition from modal submission
   */
  async processWalletAddition(context: SlackViewContext): Promise<void> {
    const userId = context.body.user.id;
    const values = context.view.state.values;
    const input = values.wallet_input.wallet_address.value?.trim();

    try {
      if (!input) {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input: 'Please enter a wallet address or ENS name'
          }
        });
        return;
      }

      // Use base service for validation and addition
      const result = await this.addUserWallet(userId, input, 'slack');

      if (!result.success) {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input: result.message
          }
        });
        return;
      }

      // Success - close modal and send message
      await context.ack();

      // Get display name for the added address
      const displayName = await this.ensResolver.resolveDisplayName(result.address!);

      await context.client.chat.postMessage({
        channel: userId,
        text: `✅ Wallet added successfully: ${displayName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Wallet added successfully!*\n${displayName}`
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error adding wallet:', error);
      await context.ack({
        response_action: 'errors',
        errors: {
          wallet_input: 'An error occurred. Please try again.'
        }
      });
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
          text: 'Sorry, there was an error. Please try again later.',
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
            text: isSelected ? uiMessages.selection.selected : uiMessages.selection.select,
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