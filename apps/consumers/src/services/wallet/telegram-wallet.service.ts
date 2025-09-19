/**
 * Telegram-specific wallet service implementation.
 * Handles UI interactions and platform-specific logic while delegating
 * business logic to BaseWalletService.
 */

import { BaseWalletService } from './base-wallet.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { EnsResolverService } from '../ens-resolver.service';
import { ContextWithSession } from '../../interfaces/bot.interface';
import {
  WALLET_SELECTION_MESSAGE,
  ADD_WALLET_BUTTON_TEXT,
  REMOVE_WALLET_BUTTON_TEXT,
  WALLET_INPUT_MESSAGE,
  WALLET_PROCESSING_MESSAGE,
  WALLET_SUCCESS_MESSAGE,
  WALLET_ERROR_MESSAGE,
  WALLET_REMOVE_CONFIRMATION_MESSAGE,
  WALLET_REMOVE_CONFIRM_BUTTON_TEXT,
  WALLET_REMOVE_SUCCESS_MESSAGE,
  NO_WALLETS_MESSAGE
} from '../../messages';

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

      let message = WALLET_SELECTION_MESSAGE;

      if (wallets.length === 0) {
        message = NO_WALLETS_MESSAGE;
      } else {
        // Show current wallets with ENS names when available
        const walletList = wallets.map((wallet, index) =>
          `${index + 1}. ${wallet.displayName || wallet.address}`
        );

        message = `${WALLET_SELECTION_MESSAGE}\n\n${walletList.join('\n')}`;
      }

      const keyboard = {
        inline_keyboard: [
          [
            { text: ADD_WALLET_BUTTON_TEXT, callback_data: 'wallet_add' },
            { text: REMOVE_WALLET_BUTTON_TEXT, callback_data: 'wallet_remove' }
          ]
        ]
      };

      await ctx.reply(message, { reply_markup: keyboard });
    } catch (error) {
      console.error('Error loading wallets:', error);
      await ctx.reply('Sorry, there was an error loading your wallets. Please try again later.');
    }
  }

  /**
   * Start the add wallet flow
   */
  async addWallet(ctx: ContextWithSession): Promise<void> {
    this.ensureSession(ctx);

    ctx.session.walletAction = 'add';
    ctx.session.awaitingWalletInput = true;

    await ctx.reply(WALLET_INPUT_MESSAGE);
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
        await ctx.reply(NO_WALLETS_MESSAGE);
        return;
      }

      ctx.session.walletAction = 'remove';
      ctx.session.walletsToRemove = new Set<string>();

      const keyboard = {
        inline_keyboard: [
          // Create checkboxes for each wallet with ENS names when available
          ...wallets.map(wallet => [{
            text: `☐ ${wallet.displayName || wallet.address}`,
            callback_data: `wallet_toggle_${wallet.address}`
          }]),
          [
            { text: WALLET_REMOVE_CONFIRM_BUTTON_TEXT, callback_data: 'wallet_confirm_remove' }
          ]
        ]
      };

      await ctx.reply(WALLET_REMOVE_CONFIRMATION_MESSAGE, { reply_markup: keyboard });
    } catch (error) {
      console.error('Error loading wallets for removal:', error);
      await ctx.reply('Sorry, there was an error loading your wallets. Please try again later.');
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
      await ctx.reply(WALLET_PROCESSING_MESSAGE);

      // Use base service for validation and addition
      const result = await this.addUserWallet(userId.toString(), input, 'telegram');

      if (result.success) {
        await ctx.reply(WALLET_SUCCESS_MESSAGE);
      } else {
        await ctx.reply(`❌ ${result.message}`);
      }

      // Reset session state
      ctx.session.awaitingWalletInput = false;
      ctx.session.walletAction = undefined;

    } catch (error) {
      console.error('Error adding wallet:', error);
      await ctx.reply(WALLET_ERROR_MESSAGE);
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
              text: `${isSelected ? '☑️' : '☐'} ${wallet.displayName || wallet.address}`,
              callback_data: `wallet_toggle_${wallet.address}`
            }];
          }),
          [
            { text: WALLET_REMOVE_CONFIRM_BUTTON_TEXT, callback_data: 'wallet_confirm_remove' }
          ]
        ]
      };

      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      console.error('Error toggling wallet selection:', error);
      await ctx.answerCbQuery('Failed to update selection. Please try again.');
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
      await ctx.reply('Please select at least one wallet to remove.');
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
        await ctx.reply(WALLET_REMOVE_SUCCESS_MESSAGE);
      } else {
        await ctx.reply(`❌ ${result.message}`);
      }

      // Reset session state
      ctx.session.walletsToRemove = new Set<string>();
      ctx.session.walletAction = undefined;

    } catch (error) {
      console.error('Error removing wallets:', error);
      await ctx.reply('Sorry, there was an error removing your wallets. Please try again later.');
    }
  }
}