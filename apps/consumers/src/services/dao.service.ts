/**
 * Handles all DAO-related interactions in the Telegram bot.
 * Manages the state of DAO selections for each user and provides
 * functionality for toggling DAO selections and confirming choices.
 * Uses inline keyboards for interactive selection.
 */

import { Context } from 'telegraf';
import { CONFIRM_SELECTION_BUTTON, NO_DAO_SELECTED_MESSAGE, SELECTED_DAOS_MESSAGE, DAO_SELECTION_MESSAGE, EDIT_DAOS_MESSAGE } from '../messages';
import { SubscriptionAPIService } from './subscription-api.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { ContextWithSession } from '../interfaces/bot.interface';

export class DAOService {
  
  // DAO emojis mapping
  private daoEmojis = new Map<string, string>([
    ['UNISWAP', '🦄'],
    ['ENS', '🔷']
  ]);
  
  constructor(
    private anticaptureClient: AnticaptureClient,
    private subscriptionApi: SubscriptionAPIService
  ) {}

  private ensureSession(ctx: ContextWithSession): void {
    if (!ctx.session) {
      ctx.session = { daoSelections: new Set<string>() };
    }
  }

  private getDaoWithEmoji(dao: string): string {
    const normalizedDao = dao.toUpperCase();
    const emoji = this.daoEmojis.get(normalizedDao) || '🏛️';
    return `${emoji} ${dao}`;
  }

  async initialize(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    this.ensureSession(ctx);

    try {
      const daos = await this.anticaptureClient.getDAOs();
      if (daos.length === 0) {
        await ctx.reply('No DAOs available at the moment. Please try again later.');
        return;
      }

      const userPreferences = await this.subscriptionApi.getUserPreferences(chatId, daos);
      const currentSelections = new Set<string>(userPreferences);
      ctx.session.daoSelections = currentSelections;

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

  async toggle(ctx: ContextWithSession, daoName: string): Promise<void> {
    const chatId = ctx.chat?.id;
    const messageId = ctx.callbackQuery?.message?.message_id;
    if (!chatId || !messageId) return;
    
    this.ensureSession(ctx);
    
    const userSelectedDAOs = ctx.session.daoSelections;
    const normalizedDaoName = daoName.toUpperCase();
    if (userSelectedDAOs.has(normalizedDaoName)) {
      userSelectedDAOs.delete(normalizedDaoName);
    } else {
      userSelectedDAOs.add(normalizedDaoName);
    }
    ctx.session.daoSelections = userSelectedDAOs;
    try {
      const daos = await this.anticaptureClient.getDAOs();
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

  async confirm(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    
    this.ensureSession(ctx);
    
    const selectedDAOs = ctx.session.daoSelections;
    if (!selectedDAOs) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    try {
      await this.updateSubscriptions(chatId, selectedDAOs);
      await this.showConfirmationMessage(ctx, selectedDAOs);
      ctx.session.daoSelections = new Set<string>();
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      await ctx.reply('Sorry, there was an error updating your subscriptions. Please try again later.');
    }
  }

  private async updateSubscriptions(chatId: number, selectedDAOs: Set<string>) {
    const daos = await this.anticaptureClient.getDAOs();
    const currentPreferences = await this.subscriptionApi.getUserPreferences(chatId, daos);
    const currentPreferencesSet = new Set(currentPreferences);
    
    const toSubscribe = Array.from(selectedDAOs).filter(dao => !currentPreferencesSet.has(dao));
    const toUnsubscribe = currentPreferences.filter(dao => !selectedDAOs.has(dao));
    
    const promises = [
      ...toSubscribe.map(daoId => this.subscriptionApi.saveUserPreference(daoId, chatId, true)),
      ...toUnsubscribe.map(daoId => this.subscriptionApi.saveUserPreference(daoId, chatId, false))
    ];

    await Promise.all(promises);
  }

  private async showConfirmationMessage(ctx: Context, selectedDAOs: Set<string>) {
    if (selectedDAOs.size > 0) {
      const daoList = Array.from(selectedDAOs)
        .map(dao => this.getDaoWithEmoji(dao))
        .join('\n');
      
      const successMessage = `${SELECTED_DAOS_MESSAGE}
${daoList}

${EDIT_DAOS_MESSAGE}`;
      
      await ctx.reply(successMessage, { parse_mode: 'HTML' });
    } else {
      await ctx.reply('You have unsubscribed from all DAOs. You can subscribe again anytime by clicking on DAOs', { parse_mode: 'HTML' });
    }
  }
} 