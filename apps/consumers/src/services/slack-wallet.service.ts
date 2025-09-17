/**
 * Handles all wallet-related interactions in the Slack bot.
 * Manages wallet addresses for users and provides functionality for
 * adding, removing, and displaying wallet addresses.
 * Uses Block Kit for rich interactive UI.
 */

import { SlackCommandContext, SlackActionContext, SlackViewContext } from '../interfaces/slack-context.interface';
import { SubscriptionAPIService } from './subscription-api.service';
import { EnsResolverService } from './ens-resolver.service';

export class SlackWalletService {

  constructor(
    private subscriptionApi: SubscriptionAPIService,
    private ensResolver: EnsResolverService
  ) {}

  /**
   * Display the wallet management interface
   */
  async initialize(context: SlackCommandContext, action: 'add' | 'remove' | 'list'): Promise<void> {
    const userId = context.body.user_id;

    try {
      await context.ack();

      if (action === 'list') {
        await this.listWallets(context);
        return;
      }

      if (action === 'add') {
        await this.startAddWallet(context);
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

    try {
      const wallets = await this.subscriptionApi.getUserWallets(userId, 'slack');

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: "You haven't added any wallets yet. Use `/dao-notify wallet add` to get started!",
            response_type: 'ephemeral'
          });
        }
        return;
      }

      // Build wallet list with ENS names
      const walletBlocks: any[] = [];
      for (const wallet of wallets) {
        const displayName = await this.ensResolver.resolveDisplayName(wallet.address);
        walletBlocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• ${displayName}`
          }
        });
      }

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
   * Start the add wallet flow - opens a modal
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
      console.error('Error opening add wallet modal:', error);
    }
  }

  /**
   * Start the remove wallet flow
   */
  async startRemoveWallet(context: SlackCommandContext): Promise<void> {
    const userId = context.body.user_id;

    try {
      const wallets = await this.subscriptionApi.getUserWallets(userId, 'slack');

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
      await context.ack();

      if (!input) {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input: 'Please enter a wallet address or ENS name'
          }
        });
        return;
      }

      let address: string;

      // Validate address format
      if (/^0x[a-fA-F0-9]{40}$/i.test(input)) {
        address = input;
      } else if (input.includes('.')) {
        // Try ENS resolution
        const resolved = await this.ensResolver.resolveToAddress(input);
        if (!resolved) {
          await context.ack({
            response_action: 'errors',
            errors: {
              wallet_input: 'Invalid ENS name or could not resolve'
            }
          });
          return;
        }
        address = resolved;
      } else {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input: 'Invalid address format. Please enter a valid address or ENS name'
          }
        });
        return;
      }

      // Check if wallet already exists
      const existingWallets = await this.subscriptionApi.getUserWallets(userId, 'slack');
      const alreadyExists = existingWallets.some(
        wallet => wallet.address.toLowerCase() === address.toLowerCase()
      );

      if (alreadyExists) {
        await context.ack({
          response_action: 'errors',
          errors: {
            wallet_input: 'This wallet has already been added'
          }
        });
        return;
      }

      // Add wallet
      await this.subscriptionApi.addUserWallet(userId, address, 'slack');

      // Send success message
      const displayName = await this.ensResolver.resolveDisplayName(address);
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
      const wallets = await this.subscriptionApi.getUserWallets(userId, 'slack');
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

      // Remove selected wallets
      const promises = Array.from(walletsToRemove).map(address =>
        this.subscriptionApi.removeUserWallet(userId, address, 'slack')
      );
      await Promise.all(promises);

      if (context.respond) {
        await context.respond({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Success!* Removed ${walletsToRemove.size} wallet(s).`
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
  private async buildWalletRemovalBlocks(wallets: any[], selections: Set<string>): Promise<any[]> {
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
      const displayName = await this.ensResolver.resolveDisplayName(wallet.address);
      const isSelected = selections.has(wallet.address);

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