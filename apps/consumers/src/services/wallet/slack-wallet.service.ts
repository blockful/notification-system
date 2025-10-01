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
import { slackMessages, uiMessages, replacePlaceholders } from '@notification-system/messages';

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
          response_type: 'ephemeral'
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

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: slackMessages.wallet.emptyList,
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
                text: slackMessages.wallet.listHeader
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
                  text: slackMessages.wallet.instructions
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
          text: slackMessages.genericError,
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
              text: `${slackMessages.wallet.help.title}\n\n${slackMessages.wallet.help.instructions}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: slackMessages.wallet.help.examples
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: slackMessages.wallet.help.privacy
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
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;
    const inputs = walletAddress.trim().split(/\s+/).filter(a => a.length > 0);

    // Validate limit
    if (inputs.length > 10) {
      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.inline.maxAddressesError,
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
        message += replacePlaceholders(slackMessages.wallet.inline.addedSuccess, { count: toAdd.length });
      }
      if (duplicates.length > 0) {
        message += replacePlaceholders(slackMessages.wallet.inline.duplicatesWarning, { count: duplicates.length });
      }
      if (invalid.length > 0) {
        message += replacePlaceholders(slackMessages.wallet.inline.invalidError, { 
          count: invalid.length, 
          list: invalid.slice(0, 3).join(', ') 
        });
        if (invalid.length > 3) {
          message += replacePlaceholders(slackMessages.wallet.inline.andMore, { count: invalid.length - 3 });
        }
      }

      if (context.respond) {
        await context.respond({
          text: message || slackMessages.wallet.inline.done,
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error adding wallet(s):', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.inline.addError,
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
            text: slackMessages.wallet.addModal.title
          },
          submit: {
            type: 'plain_text',
            text: slackMessages.wallet.addModal.submit
          },
          close: {
            type: 'plain_text',
            text: slackMessages.wallet.addModal.cancel
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: slackMessages.wallet.addModal.hint
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
                  text: slackMessages.wallet.addModal.placeholder
                }
              },
              label: {
                type: 'plain_text',
                text: slackMessages.wallet.addModal.label
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error adding wallet(s):', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.wallet.addError,
          response_type: 'ephemeral'
        });
      }
    }
  }

  /**
   * Start the remove wallet flow
   */
  async startRemoveWallet(context: SlackCommandContext): Promise<void> {
    const channelId = context.body.channel_id;
    const workspaceId = context.body.team_id;
    const fullUserId = `${workspaceId}:${channelId}`;

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(fullUserId, 'slack');

      if (wallets.length === 0) {
        if (context.respond) {
          await context.respond({
            text: slackMessages.wallet.noWalletsToRemove,
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
          text: slackMessages.wallet.removeInstructions,
          blocks,
          response_type: 'ephemeral'
        });
      }
    } catch (error) {
      console.error('Error starting wallet removal:', error);
      if (context.respond) {
        await context.respond({
          text: slackMessages.genericError,
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
            wallet_input: slackMessages.wallet.addModal.validationError
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
              text: replacePlaceholders(slackMessages.wallet.addedSuccess, { displayName })
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error adding wallet:', error);
      await context.ack({
        response_action: 'errors',
        errors: {
          wallet_input: slackMessages.wallet.addError
        }
      });
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
            text: uiMessages.warnings.selectAtLeastOneWallet,
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
                  ? replacePlaceholders(slackMessages.wallet.removedSuccess, { message: result.message })
                  : `${uiMessages.status.error} ${result.message}`
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
          text: slackMessages.genericError,
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
          text: slackMessages.wallet.removeHeader
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
          text: `${isSelected ? uiMessages.selection.checked : uiMessages.selection.unchecked} ${displayName}`
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