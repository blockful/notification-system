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

➡️ To start using the system, you'll need to add the DAOs you want to receive notifications from by clicking on "DAOs".
➡️ After that, click on "My Wallets" and add your wallet address to receive custom notifications.`;

export const HELP_MESSAGE = `
<b>What is Anticapture?</b>
A governance security research, notification system and dashboard that tracks social dynamics, governance models, and contracts, ensuring security and preventing malicious capture.

<b>What is this bot for?</b>
Get notified about risks, changes and proposals that you care about the DAOs you're in.

<b>Commands that might be useful</b>
/start
/learn_more
/daos`;

export const UNKNOWN_COMMAND_MESSAGE = '❌ Unknown command. Use /learn_more to see available commands.';

export const DAO_SELECTION_MESSAGE = 'Select the DAOs you want to track (you can select multiple):';

export const NO_DAO_SELECTED_MESSAGE = 'Please select at least one DAO before confirming.';
export const CONFIRM_SELECTION_BUTTON = '✅ Confirm selection';
export const SELECTED_DAOS_MESSAGE = `Success! Your DAOs are now under surveillance (the good kind).
You'll be notified when things get spicy:`;

export const EDIT_DAOS_MESSAGE = 'You can edit this list by clicking on 🌐 DAOs';

// Static buttons messages
export const DAOS_BUTTON_TEXT = '🌐 DAOs';
export const LEARN_MORE_BUTTON_TEXT = '💡 Learn More';
export const MY_WALLETS_BUTTON_TEXT = '📝 My Wallets';

// Wallet-related messages
export const WALLET_SELECTION_MESSAGE = `Here's the wallets you have added to receive custom notifications:`;
export const ADD_WALLET_BUTTON_TEXT = '➕ Add wallet';
export const REMOVE_WALLET_BUTTON_TEXT = '❌ Remove wallet';
export const WALLET_INPUT_MESSAGE = '👉 Please enter your address or ENS name:';
export const WALLET_PROCESSING_MESSAGE = '⏱️ Hang tight, we\'re just connecting your data…';
export const WALLET_SUCCESS_MESSAGE = '✅ All set! Your wallet has been added.';
export const WALLET_ERROR_MESSAGE = '❌ Invalid wallet address. Please try again.';
export const WALLET_REMOVE_CONFIRMATION_MESSAGE = 'Select the wallets you want to remove:';
export const WALLET_REMOVE_CONFIRM_BUTTON_TEXT = '🗑️ Confirm removal';
export const WALLET_REMOVE_SUCCESS_MESSAGE = '✅ Selected wallets have been removed.';
export const NO_WALLETS_MESSAGE = 'You haven\'t added any wallets yet. Click "Add wallet" to get started.'; 