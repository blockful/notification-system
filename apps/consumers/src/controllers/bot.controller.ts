/**
 * Main command controller for the Telegram bot.
 * Sets up all available commands and their corresponding actions.
 * Routes callback queries to appropriate services based on their type.
 */

import { Telegraf, Markup } from 'telegraf';
import { WELCOME_MESSAGE, HELP_MESSAGE, DAOS_BUTTON_TEXT, LEARN_MORE_BUTTON_TEXT } from '../messages';
import { DAOService } from '../services/dao.service';

export class BotController {
  private bot: Telegraf;
  private daoService: DAOService;

  constructor(token: string, daoService: DAOService) {
    this.bot = new Telegraf(token);
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

  public launch(): void {
    this.bot.launch();
    console.log('🤖 Bot is running...');
  }

  public stop(signal: string): void {
    this.bot.stop(signal);
  }
} 