/**
 * Handles all DAO-related interactions in the Telegram bot.
 * Manages the state of DAO selections for each user and provides
 * functionality for toggling DAO selections and confirming choices.
 * Uses inline keyboards for interactive selection.
 */

import { Context } from 'telegraf';
import { CONFIRM_SELECTION_BUTTON, NO_DAO_SELECTED_MESSAGE, SELECTED_DAOS_MESSAGE, DAO_SELECTION_MESSAGE } from '../messages';
import { DatabaseService } from '../db';

// Store selected DAOs for each user
export const userSelections = new Map<number, Set<string>>();

export const handleDAOSelection = {
  initialize: async (ctx: Context, dbService: DatabaseService) => {
    const chatId = ctx.chat?.id;
    
    if (!chatId) return;

    if (!userSelections.has(chatId)) {
      userSelections.set(chatId, new Set());
    }

    try {
      // Get DAOs from database
      const daos = await dbService.getDAOs();
      
      if (daos.length === 0) {
        await ctx.reply('No DAOs available at the moment. Please try again later.');
        return;
      }

      // Create initial keyboard with DAOs from database
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
  },

  toggle: async (ctx: Context, daoName: string, dbService: DatabaseService) => {
    const chatId = ctx.chat?.id;
    const messageId = ctx.callbackQuery?.message?.message_id;

    if (!chatId || !messageId) return;

    // Get or create the user's selection set
    const userSelectedDAOs = userSelections.get(chatId) || new Set();
    
    // Normalize DAO name to uppercase for consistency
    const normalizedDaoName = daoName.toUpperCase();
    
    // Toggle the selection
    if (userSelectedDAOs.has(normalizedDaoName)) {
      userSelectedDAOs.delete(normalizedDaoName);
    } else {
      userSelectedDAOs.add(normalizedDaoName);
    }

    // Save the selection back to the map
    userSelections.set(chatId, userSelectedDAOs);

    try {
      // Get DAOs from database and create keyboard
      const daos = await dbService.getDAOs();
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

      // Only update if there are changes
      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      console.error('Error updating keyboard:', error);
      await ctx.answerCbQuery('Failed to update selection. Please try again.');
    }
  },

  confirm: async (ctx: Context, dbService: DatabaseService) => {
    const chatId = ctx.chat?.id;

    if (!chatId) return;

    const selectedDAOs = userSelections.get(chatId);
    if (selectedDAOs && selectedDAOs.size > 0) {
      await ctx.reply(`${SELECTED_DAOS_MESSAGE} ${Array.from(selectedDAOs).join(', ')}`);
      await dbService.saveUserPreferences(chatId, selectedDAOs);
      // Clear the selections after saving
      userSelections.delete(chatId);
    } else {
      await ctx.reply(NO_DAO_SELECTED_MESSAGE);
    }
  }
}; 