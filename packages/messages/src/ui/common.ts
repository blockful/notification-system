/**
 * Common UI messages used across all platforms
 */

export const uiMessages = {
  // Welcome and help messages
  welcome: `🔔 Welcome to the Anticapture notification system!
Spotting the "oh no" before it hits your treasury.`,

  welcomeDao:`➡️ To get started, add the DAOs you want to track.

  You will receive alerts for:
- New Proposals on the DAO
- Proposal results when it finishes
- Vote reminders

Stay ahead of governance risk. Stay informed.

Use ⚙️ Settings to choose which notifications you receive.`,

  help: `<b>What is Anticapture?</b>
A governance security research, notification system and dashboard that tracks social dynamics, governance models, and contracts, ensuring security and preventing malicious capture.

<b>What is this bot for?</b>
Get notified about risks, changes and proposals that you care about in the DAOs you follow.

<b>Actions that might be useful</b>`,

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
    confirmRemoval: '🗑️ Confirm removal',
    start: '🚀 Start',
    wallets: '📝 Wallets',
    settings: '⚙️ Settings',
    selectAll: 'Select all',
    unselectAll: 'Unselect all'
  },

  // Wallet management messages
  wallet: {
    selectionPrefix: '👉 Next step: ',
    selection: `Add your wallet address

This allows us to personalize alerts based on your governance activity and delegations.

You'll receive notifications for:
- Delegation changes that affect your voting power
- Transfers that affect your voting power
- Non-voting alerts
- Vote confirmations

Stay aware of how changes in governance affect you.`,
    input: '👉 Please enter your address or ENS name:',
    processing: '⏱️ Hang tight, we\'re just connecting your data…',
    success: '✅ All set! Your wallet has been added.',
    onboardingComplete: `🎉 You're all set! Stay tuned — we'll notify you as soon as something important happens in your DAOs.`,
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