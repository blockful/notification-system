/**
 * Telegram-specific wallet service implementation.
 * Handles UI interactions and platform-specific logic while delegating
 * business logic to BaseWalletService.
 */

import { BaseWalletService } from './base-wallet.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { EnsResolverService } from '../ens-resolver.service';
import { ContextWithSession } from '../../interfaces/bot.interface';
import { uiMessages } from '@notification-system/messages';

export class TelegramWalletService extends BaseWalletService {

  constructor(
    subscriptionApi: SubscriptionAPIService,
    ensResolver: EnsResolverService
  ) {
    super(subscriptionApi, ensResolver);
  }

  private ensureSession(ctx: ContextWithSession): void {
    if (!ctx.session) {
      ctx.session = {
        daoSelections: new Set<string>(),
        walletAction: undefined,
        walletsToRemove: new Set<string>(),
        awaitingWalletInput: false
      };
    }
  }

  /**
   * Display the wallet management interface
   */
  async initialize(ctx: ContextWithSession): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.ensureSession(ctx);

    try {
      // Get user's current wallets
      const wallets = await this.getUserWalletsWithDisplayNames(userId.toString(), 'telegram');

      let message = uiMessages.wallet.selection;

      if (wallets.length === 0) {
        message = uiMessages.wallet.noWallets;
      } else {
        // Show current wallets with ENS names when available
        const walletList = wallets.map((wallet, index) =>
          `${index + 1}. ${wallet.displayName || wallet.address}`
        );

        message = `${uiMessages.wallet.selection}\n\n${walletList.join('\n')}`;
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: uiMessages.buttons.addWallet, callback_data: 'wallet_add' },
            { text: uiMessages.buttons.removeWallet, callback_data: 'wallet_remove' }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: keyboard });
    } catch (error) {
      console.error('Error loading wallets:', error);
      await ctx.reply(uiMessages.errors.loadingWallets);
    }
  }

  /**
   * Start the add wallet flow
   */
  async addWallet(ctx: ContextWithSession): Promise<void> {
    this.ensureSession(ctx);

    ctx.session.walletAction = 'add';
    ctx.session.awaitingWalletInput = true;

    await ctx.reply(uiMessages.wallet.input);
  }

  /**
   * Start the remove wallet flow
   */
  async removeWallet(ctx: ContextWithSession): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.ensureSession(ctx);

    try {
      const wallets = await this.getUserWalletsWithDisplayNames(userId.toString(), 'telegram');

      if (wallets.length === 0) {
        await ctx.reply(uiMessages.wallet.noWallets);
        return;
      }

      ctx.session.walletAction = 'remove';
      ctx.session.walletsToRemove = new Set<string>();

      const keyboard = {
        inline_keyboard: [
          // Create checkboxes for each wallet with ENS names when available
          ...wallets.map(wallet => [{
            text: `${uiMessages.selection.unchecked} ${wallet.displayName || wallet.address}`,
            callback_data: `wallet_toggle_${wallet.address}`
          }]),
          [
            { text: uiMessages.buttons.confirmRemoval, callback_data: 'wallet_confirm_remove' }
          ]
        ]
      };

      await ctx.reply(uiMessages.wallet.removeConfirmation, { reply_markup: keyboard });
    } catch (error) {
      console.error('Error loading wallets for removal:', error);
      await ctx.reply(uiMessages.errors.loadingWallets);
    }
  }

  /**
   * Process wallet input from user
   */
  async processWalletInput(ctx: ContextWithSession, input: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.ensureSession(ctx);

    if (!ctx.session.awaitingWalletInput) {
      return; // Not expecting wallet input
    }

    try {
      await ctx.reply(uiMessages.wallet.processing);

      // Use base service for validation and addition
      const result = await this.addUserWallet(userId.toString(), input, 'telegram');

      if (result.success) {
        await ctx.reply(uiMessages.wallet.success);
      } else {
        await ctx.reply(`${uiMessages.status.error} ${result.message}`);
      }

      // Reset session state
      ctx.session.awaitingWalletInput = false;
      ctx.session.walletAction = undefined;

    } catch (error) {
      console.error('Error adding wallet:', error);
      await ctx.reply(uiMessages.errors.generic);
    }
  }

  /**
   * Toggle wallet selection for removal
   */
  async toggleWalletForRemoval(ctx: ContextWithSession, address: string): Promise<void> {
    const userId = ctx.from?.id;
    const messageId = ctx.callbackQuery?.message?.message_id;
    if (!userId || !messageId) return;

    this.ensureSession(ctx);

    if (!ctx.session.walletsToRemove) {
      ctx.session.walletsToRemove = new Set<string>();
    }

    // Toggle selection
    if (ctx.session.walletsToRemove.has(address)) {
      ctx.session.walletsToRemove.delete(address);
    } else {
      ctx.session.walletsToRemove.add(address);
    }

    try {
      // Get current wallets to rebuild keyboard
      const wallets = await this.getUserWalletsWithDisplayNames(userId.toString(), 'telegram');

      const keyboard = {
        inline_keyboard: [
          ...wallets.map(wallet => {
            const isSelected = ctx.session.walletsToRemove?.has(wallet.address);
            return [{
              text: `${isSelected ? uiMessages.selection.checked : uiMessages.selection.unchecked} ${wallet.displayName || wallet.address}`,
              callback_data: `wallet_toggle_${wallet.address}`
            }];
          }),
          [
            { text: uiMessages.buttons.confirmRemoval, callback_data: 'wallet_confirm_remove' }
          ]
        ]
      };

      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      console.error('Error toggling wallet selection:', error);
      await ctx.answerCbQuery(uiMessages.errors.updateFailed);
    }
  }

  /**
   * Confirm removal of selected wallets
   */
  async confirmRemoval(ctx: ContextWithSession): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    this.ensureSession(ctx);

    const walletsToRemove = ctx.session.walletsToRemove;
    if (!walletsToRemove || walletsToRemove.size === 0) {
      await ctx.reply(uiMessages.warnings.selectAtLeastOneWallet);
      return;
    }

    try {
      // Use base service for removal
      const result = await this.removeUserWallets(
        userId.toString(),
        Array.from(walletsToRemove),
        'telegram'
      );

      if (result.success) {
        await ctx.reply(uiMessages.wallet.removeSuccess);
      } else {
        await ctx.reply(`${uiMessages.status.error} ${result.message}`);
      }

      // Reset session state
      ctx.session.walletsToRemove = new Set<string>();
      ctx.session.walletAction = undefined;

    } catch (error) {
      console.error('Error removing wallets:', error);
      await ctx.reply(uiMessages.errors.generic);
    }
  }
}