/**
 * Telegram Bot Service
 * Handles all Telegram bot functionality including commands, notifications, and user interactions.
 * Consolidates both interactive commands and notification sending capabilities.
 */

import { Telegraf, Markup } from 'telegraf';
import { WELCOME_MESSAGE, HELP_MESSAGE, DAOS_BUTTON_TEXT, LEARN_MORE_BUTTON_TEXT } from '../messages';
import { DAOService } from '../services/dao.service';
import { ContextWithSession } from '../interfaces/bot.interface';
import { NotificationPayload } from '../interfaces/notification.interface';

export class TelegramBotService {
  private bot: Telegraf<ContextWithSession>;
  private daoService: DAOService;

  constructor(bot: Telegraf<ContextWithSession>, daoService: DAOService) {
    this.bot = bot;
    this.daoService = daoService;
    this.setupCommands();
  }

  /**
   * Creates the persistent keyboard with static buttons
   */
  private createPersistentKeyboard() {
    return Markup.keyboard([
      [DAOS_BUTTON_TEXT, LEARN_MORE_BUTTON_TEXT]
    ])
    .resize()
    .persistent();
  }

  private setupCommands(): void {
    this.bot.command(/^start$/i, async (ctx) => {
      await ctx.reply(WELCOME_MESSAGE, this.createPersistentKeyboard());
    });

    this.bot.command(/^learn_more$/i, async (ctx) => {
      await ctx.reply(HELP_MESSAGE, { 
        parse_mode: 'HTML',
        ...this.createPersistentKeyboard() 
      });
    });

    this.bot.command(/^daos$/i, async (ctx) => {
      await this.daoService.initialize(ctx);
    });

    this.bot.hears(DAOS_BUTTON_TEXT, async (ctx) => {
      await this.daoService.initialize(ctx);
    });

    this.bot.hears(LEARN_MORE_BUTTON_TEXT, async (ctx) => {
      await ctx.reply(HELP_MESSAGE, { 
        parse_mode: 'HTML',
        ...this.createPersistentKeyboard() 
      });
    });

    this.bot.action(/^dao_toggle_(\w+)$/, async (ctx) => {
      const daoName = ctx.match[1];
      await this.daoService.toggle(ctx, daoName);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^dao_confirm$/, async (ctx) => {
      await this.daoService.confirm(ctx);
      await ctx.answerCbQuery();
    });

    this.bot.on('message', async (ctx, next) => {
      if ('text' in ctx.message && !ctx.message.text.startsWith('/')) {
        await ctx.reply('Please use the buttons below or type /learn_more for more information.', 
          this.createPersistentKeyboard());
      }
      return next();
    });
  }

  async launch(): Promise<void> {
    await this.bot.launch();
    console.log('🤖 Bot is running...');
  }

  public stop(signal: string): void {
    this.bot.stop(signal);
  }

  /**
   * Send a notification to a specific Telegram user
   * @param payload Notification payload containing user information and message
   * @returns Message ID of the sent notification
   * @throws Error if sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    const sentMessage = await this.bot.telegram.sendMessage(
      payload.channelUserId, 
      payload.message
    );
    return `${sentMessage.message_id}`;
  }
} 