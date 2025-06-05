/**
 * Handles all DAO-related interactions in the Telegram bot.
 * Manages the state of DAO selections for each user and provides
 * functionality for toggling DAO selections and confirming choices.
 * Uses inline keyboards for interactive selection.
 */

import { Context } from 'telegraf';
import { CONFIRM_SELECTION_BUTTON, NO_DAO_SELECTED_MESSAGE, SELECTED_DAOS_MESSAGE, DAO_SELECTION_MESSAGE } from '../messages';
import { SubscriptionAPIService } from './subscription-api.service';
import { AnticaptureClient } from '../clients/anticapture-client';

export class DAOService {
  // Store selected DAOs for each user temporarily
  private userSelections = new Map<number, Set<string>>();
  
  constructor(
    private anticaptureClient: AnticaptureClient,
    private subscriptionApi: SubscriptionAPIService
  ) {}

  async initialize(ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    if (!this.userSelections.has(chatId)) {
      this.userSelections.set(chatId, new Set());
    }
    try {
      const daos = await this.anticaptureClient.getDAOs();
      if (daos.length === 0) {
        await ctx.reply('No DAOs available at the moment. Please try again later.');
        return;
      }
      const keyboard = {
        inline_keyboard: [
          daos.map(dao => ({
            text: dao,
            callback_data: `dao_toggle_${dao.toUpperCase()}`
          })),
          [
            { text: CONFIRM_SELECTION_BUTTON, callback_data: 'dao_confirm' }
          ]
        ]
      };
      await ctx.reply(DAO_SELECTION_MESSAGE, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error loading DAOs:', error);
      await ctx.reply('Sorry, there was an error loading the DAOs. Please try again later.');
    }
  }

  async toggle(ctx: Context, daoName: string): Promise<void> {
    const chatId = ctx.chat?.id;
    const messageId = ctx.callbackQuery?.message?.message_id;
    if (!chatId || !messageId) return;
    const userSelectedDAOs = this.userSelections.get(chatId) || new Set();
    const normalizedDaoName = daoName.toUpperCase();
    if (userSelectedDAOs.has(normalizedDaoName)) {
      userSelectedDAOs.delete(normalizedDaoName);
    } else {
      userSelectedDAOs.add(normalizedDaoName);
    }
    this.userSelections.set(chatId, userSelectedDAOs);
    try {
      const daos = await this.anticaptureClient.getDAOs();
      const keyboard = {
        inline_keyboard: [
          daos.map((dao: string) => {
            const normalizedDao = dao.toUpperCase();
            return {
              text: userSelectedDAOs.has(normalizedDao) ? `✅ ${dao}` : dao,
              callback_data: `dao_toggle_${normalizedDao}`
            };
          }),
          [
            { text: CONFIRM_SELECTION_BUTTON, callback_data: 'dao_confirm' }
          ]
        ]
      };
      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      console.error('Error updating keyboard:', error);
      await ctx.answerCbQuery('Failed to update selection. Please try again.');
    }
  }

  async confirm(ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    const selectedDAOs = this.userSelections.get(chatId);
    if (selectedDAOs && selectedDAOs.size > 0) {
      await ctx.reply(`${SELECTED_DAOS_MESSAGE} ${Array.from(selectedDAOs).join(', ')}`);
      await Promise.all(
        Array.from(selectedDAOs).map(daoId =>
          this.subscriptionApi.saveUserPreference(daoId, chatId, true)
        )
      );
      this.userSelections.delete(chatId);
    } else {
      await ctx.reply(NO_DAO_SELECTED_MESSAGE);
    }
  }
} 