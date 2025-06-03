/**
 * Handles all DAO-related interactions in the Telegram bot.
 * Manages the state of DAO selections for each user and provides
 * functionality for toggling DAO selections and confirming choices.
 * Uses inline keyboards for interactive selection.
 */

import { Context } from 'telegraf';
import { CONFIRM_SELECTION_BUTTON, NO_DAO_SELECTED_MESSAGE, SELECTED_DAOS_MESSAGE, DAO_SELECTION_MESSAGE, EDIT_DAOS_MESSAGE } from '../messages';
import { SubscriptionAPIService } from './subscription-api.service';
import { IDatabaseService } from '../interfaces/db.interface';

export class DAOService {
  // Store selected DAOs for each user temporarily
  private userSelections = new Map<number, Set<string>>();
  
  // DAO emojis mapping
  private daoEmojis = new Map<string, string>([
    ['UNISWAP', '🦄'],
    ['ENS', '🔷']
  ]);
  
  constructor(
    private dbService: IDatabaseService,
    private subscriptionApi: SubscriptionAPIService
  ) {}

  private getDaoWithEmoji(dao: string): string {
    const normalizedDao = dao.toUpperCase();
    const emoji = this.daoEmojis.get(normalizedDao) || '🏛️';
    return `${emoji} ${dao}`;
  }

  async initialize(ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    try {
      const daos = await this.dbService.getDAOs();
      if (daos.length === 0) {
        await ctx.reply('No DAOs available at the moment. Please try again later.');
        return;
      }

      // Load user's current preferences from the subscription API
      const userPreferences = await this.subscriptionApi.getUserPreferences(chatId, daos);
      
      // Initialize user selections with current preferences
      const currentSelections = new Set<string>(userPreferences);
      this.userSelections.set(chatId, currentSelections);

      const keyboard = {
        inline_keyboard: [
          daos.map(dao => {
            const normalizedDao = dao.toUpperCase();
            const daoWithEmoji = this.getDaoWithEmoji(dao);
            return {
              text: currentSelections.has(normalizedDao) ? `✅ ${daoWithEmoji}` : daoWithEmoji,
              callback_data: `dao_toggle_${normalizedDao}`
            };
          }),
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
      const daos = await this.dbService.getDAOs();
      const keyboard = {
        inline_keyboard: [
          daos.map((dao: string) => {
            const normalizedDao = dao.toUpperCase();
            const daoWithEmoji = this.getDaoWithEmoji(dao);
            return {
              text: userSelectedDAOs.has(normalizedDao) ? `✅ ${daoWithEmoji}` : daoWithEmoji,
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
    if (!selectedDAOs) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    try {
      // Get current user preferences to compare changes
      const daos = await this.dbService.getDAOs();
      const currentPreferences = await this.subscriptionApi.getUserPreferences(chatId, daos);
      const currentPreferencesSet = new Set(currentPreferences);
      
      // Find DAOs to subscribe to (selected but not currently subscribed)
      const toSubscribe = Array.from(selectedDAOs).filter(dao => !currentPreferencesSet.has(dao));
      
      // Find DAOs to unsubscribe from (currently subscribed but not selected)
      const toUnsubscribe = currentPreferences.filter(dao => !selectedDAOs.has(dao));

      // Process subscriptions and unsubscriptions
      const promises = [
        ...toSubscribe.map(daoId => this.subscriptionApi.saveUserPreference(daoId, chatId, true)),
        ...toUnsubscribe.map(daoId => this.subscriptionApi.saveUserPreference(daoId, chatId, false))
      ];

      await Promise.all(promises);

      // Show success message with final selected DAOs
      if (selectedDAOs.size > 0) {
        const daoList = Array.from(selectedDAOs)
          .map(dao => this.getDaoWithEmoji(dao))
          .join('\n');
        
        const successMessage = `${SELECTED_DAOS_MESSAGE}
${daoList}

${EDIT_DAOS_MESSAGE}`;
        
        await ctx.reply(successMessage);
      } else {
        await ctx.reply('You have unsubscribed from all DAOs. You can subscribe again anytime by clicking on 🌐 DAOs');
      }
      
      this.userSelections.delete(chatId);
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      await ctx.reply('Sorry, there was an error updating your subscriptions. Please try again later.');
    }
  }
} 