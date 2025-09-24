/**
 * Common UI messages used across all platforms
 */

export const uiMessages = {
  // Welcome and help messages
  welcome: `🔔 Welcome to the Anticapture notification system!
Spotting the "oh no" before it hits your treasury.

➡️ To start using the system, you'll need to add the DAOs you want to receive notifications from by clicking on "DAOs".
➡️ After that, click on "My Wallets" and add your wallet address to receive custom notifications.`,

  help: `<b>What is Anticapture?</b>
A governance security research, notification system and dashboard that tracks social dynamics, governance models, and contracts, ensuring security and preventing malicious capture.

<b>What is this bot for?</b>
Get notified about risks, changes and proposals that you care about the DAOs you're in.

<b>Commands that might be useful</b>
/start
/learn_more
/daos`,

  unknownCommand: '❌ Unknown command. Use /learn_more to see available commands.',

  // DAO selection messages
  daoSelection: 'Select the DAOs you want to track (you can select multiple):',
  noDaoSelected: 'Please select at least one DAO before confirming.',
  confirmSelection: '✅ Confirm selection',
  selectedDaos: `Success! Your DAOs are now under surveillance (the good kind).
You'll be notified when things get spicy:`,
  editDaos: 'You can edit this list by clicking on 🌐 DAOs',

  // Button text
  buttons: {
    daos: '🌐 DAOs',
    learnMore: '💡 Learn More',
    myWallets: '📝 My Wallets',
    addWallet: '➕ Add wallet',
    removeWallet: '❌ Remove wallet',
    confirmRemoval: '🗑️ Confirm removal'
  },

  // Wallet management messages
  wallet: {
    selection: `Here's the wallets you have added to receive custom notifications:`,
    input: '👉 Please enter your address or ENS name:',
    processing: '⏱️ Hang tight, we\'re just connecting your data…',
    success: '✅ All set! Your wallet has been added.',
    error: '❌ Invalid wallet address. Please try again.',
    removeConfirmation: 'Select the wallets you want to remove:',
    removeSuccess: '✅ Selected wallets have been removed.',
    noWallets: 'You haven\'t added any wallets yet. Click "Add wallet" to get started.'
  }
};