/**
 * Main command controller for the Telegram bot.
 * Sets up all available commands and their corresponding actions.
 * Routes callback queries to appropriate services based on their type.
 */

import { Telegraf } from 'telegraf';
import { DatabaseService } from '../repositories/db'
import { 
  WELCOME_MESSAGE, 
  HELP_MESSAGE, 
} from '../messages';
import { handleDAOSelection } from '../services/dao.services';

export const setupCommands = (bot: Telegraf, dbService: DatabaseService) => {
  // Start command
  bot.command(/^start$/i, async (ctx) => {
    await ctx.reply(WELCOME_MESSAGE);
  });

  // Help command
  bot.command(/^help$/i, async (ctx) => {
    await ctx.reply(HELP_MESSAGE);
  });

  // DAO tracking command
  bot.command(/^daostotrack$/i, async (ctx) => {
    await handleDAOSelection.initialize(ctx, dbService);
  });

  // DAO toggle actions
  bot.action(/^dao_toggle_(\w+)$/, async (ctx) => {
    const daoName = ctx.match[1];
    await handleDAOSelection.toggle(ctx, daoName, dbService);
    await ctx.answerCbQuery();
  });

  // DAO confirm action
  bot.action(/^dao_confirm$/, async (ctx) => {
    await handleDAOSelection.confirm(ctx, dbService);
    await ctx.answerCbQuery();
  });

  bot.launch();
}; 