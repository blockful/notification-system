/**
 * Main command controller for the Telegram bot.
 * Sets up all available commands and their corresponding actions.
 * Routes callback queries to appropriate services based on their type.
 */

import { Telegraf } from 'telegraf';
import { WELCOME_MESSAGE, HELP_MESSAGE } from '../messages';
import { DAOService } from '../services/dao.service';

export class BotController {
  private bot: Telegraf;
  private daoService: DAOService;

  constructor(token: string, daoService: DAOService) {
    this.bot = new Telegraf(token);
    this.daoService = daoService;
    this.setupCommands();
  }

  private setupCommands(): void {
    // Start command
    this.bot.command(/^start$/i, async (ctx) => {
      await ctx.reply(WELCOME_MESSAGE);
    });

    // Help command
    this.bot.command(/^help$/i, async (ctx) => {
      await ctx.reply(HELP_MESSAGE);
    });

    // DAO tracking command
    this.bot.command(/^daostotrack$/i, async (ctx) => {
      await this.daoService.initialize(ctx);
    });

    // DAO toggle actions
    this.bot.action(/^dao_toggle_(\w+)$/, async (ctx) => {
      const daoName = ctx.match[1];
      await this.daoService.toggle(ctx, daoName);
      await ctx.answerCbQuery();
    });

    // DAO confirm action
    this.bot.action(/^dao_confirm$/, async (ctx) => {
      await this.daoService.confirm(ctx);
      await ctx.answerCbQuery();
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