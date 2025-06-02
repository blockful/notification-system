/**
 * Contains all text messages used by the Telegram bot.
 * Messages are organized by functionality and purpose.
 */

import { knownCommands } from './config/knownCommands';

const generateCommandList = () => {
  return knownCommands.map(({ command, description }) => `${command} - ${description}`).join('\n');
};

export const WELCOME_MESSAGE = `
🔔 Welcome to the Anticapture notification system!

Spotting the "oh no" before it hits your treasury.

To start using the system, you'll need to go through the following steps:

📊 Add the DAOs you want to receive notifications from by clicking on "DAOs"`;

export const HELP_MESSAGE = `
*What is Anticapture?*
A governance security research, notification system and dashboard that tracks social dynamics, governance models, and contracts, ensuring security and preventing malicious capture.

*What is this bot for?*
Get notified about risks, changes and proposals that you care about the DAOs you're in.

*Commands that might be useful*
/start
/help
/daos`;

export const UNKNOWN_COMMAND_MESSAGE = '❌ Unknown command. Use /help to see available commands.';

export const DAO_SELECTION_MESSAGE = `
📊 Add the DAOs you want to receive notifications from by clicking on "DAOs"

Select the DAOs you want to track (you can select multiple):`;

export const NO_DAO_SELECTED_MESSAGE = 'Please select at least one DAO before confirming.';
export const CONFIRM_SELECTION_BUTTON = '✅ Confirm Selection';
export const SELECTED_DAOS_MESSAGE = 'You have selected the following DAOs:';

// Static buttons messages
export const DAOS_BUTTON_TEXT = '🌐 DAOs';
export const LEARN_MORE_BUTTON_TEXT = '💡 Learn More'; 