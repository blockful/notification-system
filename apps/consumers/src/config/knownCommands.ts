/**
 * Defined Telegram bot commands
 * 
 * This file contains all available commands for the Telegram bot.
 * Used to register commands with Telegram API and provide descriptions to users.
 * When adding new commands, add them here to make them available in the bot's menu.
 */

export const knownCommands = [
    { command: '/start', description: 'Start the bot' },
    { command: '/help', description: 'See all available commands' },
    { command: '/daostotrack', description: 'See DAOs that we support' }
  ];