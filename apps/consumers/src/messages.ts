/**
 * Contains all text messages used by the Telegram bot.
 * Messages are organized by functionality and purpose.
 */

import { knownCommands } from './config/knownCommands';

const generateCommandList = () => {
  return knownCommands.map(({ command, description }) => `${command} - ${description}`).join('\n');
};

export const WELCOME_MESSAGE = `
👋 Welcome to Anticapture Bot!

Available commands:
${generateCommandList()}

We're here to help! Use /help to see more information.`;

export const HELP_MESSAGE = `
🤖 *Command List*

${generateCommandList()}

*How to use:*
1. Use /start to begin
2. Follow the instructions to register

If you need additional help, please contact support.`;

export const UNKNOWN_COMMAND_MESSAGE = '❌ Unknown command. Use /help to see available commands.';

export const DAO_SELECTION_MESSAGE = 'Select the DAOs you want to track (you can select multiple):';
export const NO_DAO_SELECTED_MESSAGE = 'Please select at least one DAO before confirming.';
export const CONFIRM_SELECTION_BUTTON = '✅ Confirm Selection';
export const SELECTED_DAOS_MESSAGE = 'You have selected the following DAOs:'; 