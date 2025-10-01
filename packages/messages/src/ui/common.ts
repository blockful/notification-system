/**
 * Common UI messages used across all platforms
 */

export const uiMessages = {
  // Welcome and help messages
  welcome: `🔔 Welcome to the Anticapture notification system!
Spotting the "oh no" before it hits your treasury.

➡️ To start using the system, you'll need to add the DAOs you want to receive notifications from by clicking on "DAOs".
➡️ After that, click on "Tracked Wallets" and add your wallet address to receive custom notifications.`,

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
    myWallets: '📝 Tracked Wallets',
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
  },

  // Status indicators (centralized emojis)
  status: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    processing: '⏱️',
    delete: '🗑️'
  },

  // Selection UI elements
  selection: {
    checked: '☑️',
    unchecked: '☐',
    selected: 'Selected',
    select: 'Select'
  },

  // Common error messages
  errors: {
    generic: 'Sorry, there was an error. Please try again later.',
    loadingWallets: 'Sorry, there was an error loading your wallets. Please try again later.',
    loadingDaos: 'Sorry, there was an error loading the DAOs. Please try again later.',
    loadingSubscriptions: 'Sorry, there was an error loading your subscriptions. Please try again later.',
    updateFailed: 'Failed to update selection. Please try again.',
    invalidAddress: 'Invalid address or ENS name. Please enter a valid Ethereum address or ENS name.',
    walletDuplicate: 'This wallet has already been added.',
    noWalletsSelected: 'No wallets selected for removal.',
    noDaosAvailable: 'No DAOs available at the moment. Please try again later.',
    somethingWrong: 'Something went wrong. Please try again.',
    updateSubscriptionsFailed: 'Sorry, there was an error updating your subscriptions. Please try again later.'
  },

  // Common success messages
  success: {
    walletAdded: 'Wallet added successfully!',
    walletsRemoved: 'Successfully removed {{count}} wallet(s).',
    subscriptionUpdated: 'Your subscriptions have been updated successfully.'
  },

  // Warning messages
  warnings: {
    selectAtLeastOne: 'Please select at least one item.',
    selectAtLeastOneDao: 'Please select at least one DAO.',
    selectAtLeastOneWallet: 'Please select at least one wallet to remove.'
  }
};