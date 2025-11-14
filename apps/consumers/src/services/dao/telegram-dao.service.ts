/**
 * Telegram-specific implementation of DAO service.
 * Handles only Telegram UI/interaction logic using inline keyboards.
 * All business logic is inherited from BaseDAOService.
 */

import { BaseDAOService } from './base-dao.service';
import { ContextWithSession } from '../../interfaces/bot.interface';
import { uiMessages, telegramMessages, getDaoWithEmoji } from '@notification-system/messages';

export class TelegramDAOService extends BaseDAOService {

  /**
   * Platform identifier for Telegram
   */
  protected getPlatformId(): string {
    return 'telegram';
  }

  /**
   * Ensure session exists with proper structure
   */
  private ensureSession(ctx: ContextWithSession): void {
    if (!ctx.session) {
      ctx.session = { daoSelections: new Set<string>() };
    }
    if (!ctx.session.daoSelections) {
      ctx.session.daoSelections = new Set<string>();
    }
  }

  /**
   * Initialize DAO selection interface with inline keyboard
   */
  async initialize(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    this.ensureSession(ctx);

    try {
      const daos = await this.fetchAvailableDAOs();
      if (daos.length === 0) {
        await ctx.reply(uiMessages.errors.noDaosAvailable);
        return;
      }

      // Load user's current subscriptions
      const userPreferences = await this.getUserSubscriptions(String(chatId));
      const currentSelections = new Set<string>(userPreferences);
      ctx.session.daoSelections = currentSelections;

      // Build inline keyboard
      const keyboard = this.buildInlineKeyboard(daos, currentSelections);

      await ctx.reply(uiMessages.daoSelection, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error loading DAOs:', error);
      await ctx.reply(uiMessages.errors.loadingDaos);
    }
  }

  /**
   * List user's current subscriptions
   */
  async listSubscriptions(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    try {
      const userPreferences = await this.getUserSubscriptions(String(chatId));

      if (userPreferences.length === 0) {
        await ctx.reply(telegramMessages.dao.emptyList);
        return;
      }

      const daoList = this.formatDAOListWithBullets(userPreferences);
      await ctx.reply(`${telegramMessages.dao.listHeader}\n\n${daoList}`, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      await ctx.reply(uiMessages.errors.loadingSubscriptions);
    }
  }

  /**
   * Toggle DAO selection when user clicks a button
   */
  async toggle(ctx: ContextWithSession, daoName: string): Promise<void> {
    const chatId = ctx.chat?.id;
    const messageId = ctx.callbackQuery?.message?.message_id;
    if (!chatId || !messageId) return;

    this.ensureSession(ctx);

    // Toggle selection in session
    const normalizedDaoName = daoName.toUpperCase();
    if (ctx.session.daoSelections.has(normalizedDaoName)) {
      ctx.session.daoSelections.delete(normalizedDaoName);
    } else {
      ctx.session.daoSelections.add(normalizedDaoName);
    }

    try {
      // Update inline keyboard to reflect new state
      const daos = await this.fetchAvailableDAOs();
      const keyboard = this.buildInlineKeyboard(daos, ctx.session.daoSelections);
      await ctx.editMessageReplyMarkup(keyboard);
    } catch (error) {
      console.error('Error updating keyboard:', error);
      await ctx.answerCbQuery(uiMessages.errors.updateFailed);
    }
  }

  /**
   * Confirm DAO selection changes
   */
  async confirm(ctx: ContextWithSession): Promise<void> {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    this.ensureSession(ctx);

    const selectedDAOs = ctx.session.daoSelections;
    if (!selectedDAOs) {
      await ctx.reply(uiMessages.errors.somethingWrong);
      return;
    }

    try {
      // Sync subscriptions to match the selected state
      await this.syncSubscriptionsToState(String(chatId), selectedDAOs);

      // Show confirmation message
      await this.showConfirmationMessage(ctx, selectedDAOs);

      // Clear session
      ctx.session.daoSelections = new Set<string>();
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      await ctx.reply(uiMessages.errors.updateSubscriptionsFailed);
    }
  }

  /**
   * Build Telegram inline keyboard for DAO selection
   */
  private buildInlineKeyboard(daos: any[], selections: Set<string>): any {
    // Create all DAO buttons
    const daoButtons = daos.map(dao => {
      const normalizedDao = dao.id.toUpperCase();
      const daoWithEmoji = getDaoWithEmoji(dao.id);
      const isSelected = selections.has(normalizedDao);

      return {
        text: isSelected ? `${uiMessages.status.success} ${daoWithEmoji}` : daoWithEmoji,
        callback_data: `dao_toggle_${normalizedDao}`
      };
    });

    // Group buttons into rows of 4
    const BUTTONS_PER_ROW = 3;
    const daoButtonRows: any[][] = [];
    
    for (let i = 0; i < daoButtons.length; i += BUTTONS_PER_ROW) {
      daoButtonRows.push(daoButtons.slice(i, i + BUTTONS_PER_ROW));
    }

    return {
      inline_keyboard: [
        ...daoButtonRows,
        // Confirm button row
        [
          { text: uiMessages.confirmSelection, callback_data: 'dao_confirm' }
        ]
      ]
    };
  }

  /**
   * Show confirmation message after updating subscriptions
   */
  private async showConfirmationMessage(ctx: any, selectedDAOs: Set<string>): Promise<void> {
    if (selectedDAOs.size > 0) {
      const daoList = this.formatDAOListWithBullets(selectedDAOs);

      const successMessage = `${uiMessages.selectedDaos}
${daoList}

${uiMessages.editDaos}`;

      await ctx.reply(successMessage, { parse_mode: 'HTML' });
    } else {
      await ctx.reply(telegramMessages.dao.allUnsubscribed,
        { parse_mode: 'HTML' });
    }
  }
}