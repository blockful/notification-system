/**
 * Slack-specific UI messages
 */

export const slackMessages = {
  // Main header message
  header: {
    title: '*🔔 Anticapture Notification System*',
    subtitle: '_Spotting the "oh no" before it hits your treasury_'
  },

  // Available commands help text
  commands: {
    header: '*Available Commands:*',
    list: [
      '• `/dao-notify subscribe` - Subscribe to DAOs',
      '• `/dao-notify unsubscribe` - Unsubscribe from DAOs',
      '• `/dao-notify list` - List subscribed DAOs',
      '• `/dao-notify wallet` - Manage your wallets',
      '• `/dao-notify help` - Show this help message'
    ].join('\n')
  },

  // Learn more link
  learnMore: 'Learn more at <https://anticapture.ai|anticapture.ai>',

  // Error message template
  error: '❌ {{message}}',

  // Generic responses
  genericError: 'Sorry, there was an error. Please try again later.',

  // Modal titles
  modals: {
    addWallet: 'Add Wallet',
    selectDaos: 'Select DAOs'
  },

  // Wallet management messages
  wallet: {
    listHeader: '*Your Wallet Addresses:*',
    emptyList: "You haven't added any wallets yet. Use '/dao-notify wallet add' to get started!",
    instructions: "Use '/dao-notify wallet add' or '/dao-notify wallet remove' to manage your wallets",
    addModal: {
      title: 'Add Wallet',
      submit: 'Add',
      cancel: 'Cancel',
      label: 'Wallet Address or ENS',
      placeholder: '0x... or name.eth',
      hint: 'Enter your wallet address or ENS name to receive custom notifications.',
      validationError: 'Please enter a wallet address or ENS name'
    },
    removeHeader: '*Select wallets to remove:*',
    removeInstructions: 'Select the wallets you want to remove:',
    noWalletsToRemove: "You don't have any wallets to remove.",
    confirmRemoval: '🗑️ Confirm Removal',
    addedSuccess: '✅ *Wallet added successfully!*\n{{displayName}}',
    removedSuccess: '✅ *Success!* {{message}}',
    addError: 'An error occurred. Please try again.'
  },

  // DAO management messages
  dao: {
    subscribeHeader: '*Select the DAOs you want to track:*',
    unsubscribeHeader: '*Select the DAOs you want to unsubscribe from:*',
    subscribeInstructions: 'Select the DAOs you want to track:',
    unsubscribeInstructions: 'Select the DAOs you want to unsubscribe from:',
    emptyList: "You're not subscribed to any DAOs yet. Use '/dao-notify subscribe' to get started!",
    listHeader: '*Your DAO Subscriptions:*',
    instructions: "Use '/dao-notify subscribe' to add more or '/dao-notify unsubscribe' to remove",
    updateInstructions: "You can update your subscriptions anytime with '/dao-notify'",
    confirmButton: '✅ Confirm Selection',
    subscribeSuccess: '✅ *Success!* You\'re now tracking: {{daoList}}',
    unsubscribeSuccess: '✅ *Success!* You\'ve unsubscribed from: {{daoList}}',
    subscribeWarning: '⚠️ Please select at least one DAO to subscribe to.',
    unsubscribeWarning: '⚠️ Please select at least one DAO to unsubscribe from.'
  },

  // Service availability errors
  serviceErrors: {
    daoUnavailable: 'DAO management is not available',
    walletUnavailable: 'Wallet management is not available'
  }
};