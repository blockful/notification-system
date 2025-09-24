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
  }
};