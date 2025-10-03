/**
 * Slack-specific UI messages
 */

export const slackMessages = {
  // Main header message
  header: {
    title: '*🔔 Anticapture Notification System*',
    subtitle: '_Spotting the "oh no" before it hits your treasury_'
  },

  // Learn more link
  learnMore: 'Learn more at <https://anticapture.ai|anticapture.com>',

  // Error message template
  error: '❌ {{message}}',

  // Generic responses
  genericError: 'Sorry, there was an error. Please try again later.',

  // Wallet management messages
  wallet: {
    listHeader: '*Your Wallet Addresses:*',
    emptyList: "You haven't added any wallets yet. Use '/anticapture wallet add' to get started!",
    instructions: "Use '/anticapture wallet add' or '/anticapture wallet remove' to manage your wallets"
  },

  // DAO management messages
  dao: {
    subscribeHeader: '*Select the DAOs you want to track:*',
    unsubscribeHeader: '*Select the DAOs you want to unsubscribe from:*',
    subscribeInstructions: 'Select the DAOs you want to track:',
    unsubscribeInstructions: 'Select the DAOs you want to unsubscribe from:',
    emptyList: "You're not subscribed to any DAOs yet. Use '/anticapture subscribe' to get started!",
    listHeader: '*Your DAO Subscriptions:*',
    instructions: "Use '/anticapture subscribe' to add more or '/anticapture unsubscribe' to remove",
    updateInstructions: "You can update your subscriptions anytime with '/anticapture'",
    confirmButton: '✅ Confirm Selection',
    subscribeSuccess: '✅ *Success!* You\'re now tracking: {{daoList}}',
    unsubscribeSuccess: '✅ *Success!* You\'ve unsubscribed from: {{daoList}}',
    subscribeWarning: '⚠️ Please select at least one DAO to subscribe to.',
    unsubscribeWarning: '⚠️ Please select at least one DAO to unsubscribe from.',
    noDaosAvailable: 'No DAOs available at the moment. Please try again later.',
    loadError: 'Sorry, there was an error loading the DAOs. Please try again later.',
    listError: 'Sorry, there was an error loading your subscriptions. Please try again later.',
    updateError: '❌ Sorry, there was an error updating your subscriptions. Please try again later.',
    buttonSelected: 'Selected',
    buttonSelect: 'Select'
  },

  // Service availability errors
  serviceErrors: {
    daoUnavailable: 'DAO management is not available',
    walletUnavailable: 'Wallet management is not available'
  },

  // Home Page blocks (used by App Home tab)
  homePage: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✨ *[Mission Initiated: Navigating the Governance Space]*\n\n' +
            'Set up your dashboard to stay on course with proposal signals from the DAOs you participate in.\n\n' +
            '---\n\n' +
            '*💎 Mission Features:*\n' +
            '• Receive real-time alerts for new proposals\n' +
            '• Be reminded when a voting window is open — don\'t miss your chance to engage\n' +
            '• Get mission reports with proposal outcomes\n' +
            '• Lock in the DAOs you want to monitor directly\n' +
            '• Connect your wallet and sync your DAOs of interest\n' +
            '• Track if your addresses are actively voting\n\n' +
            '---\n\n' +
            '*⚠️ Mission Status Update:*\n' +
            '• Currently, notifications are transmitted only to your control panel\n' +
            '• Soon, you\'ll be able to deploy the bot into your Slack channel so your entire crew can stay governance-ready\n\n' +
            '---\n\n' +
            '*Another links that might be useful*'
        }
      },
      {
        type: 'image',
        image_url: 'https://i.imgur.com/EHA4pdf.png',
        alt_text: 'Get notified of new proposals, vote reminders, and wallet activity'
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '💚 Telegram Bot', emoji: true },
            url: 'https://t.me/Anticapturebot',
            action_id: 'mission_telegram'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '🔗 Website', emoji: true },
            url: 'https://anticapture.com',
            action_id: 'mission_website'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '📖 Help', emoji: true },
            url: 'https://anticapture.com/faq',
            action_id: 'mission_help'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '💬 Contact us', emoji: true },
            url: 'https://tally.so/r/nrvGbv',
            action_id: 'mission_contact'
          }
        ]
      }
    ]
  }
};