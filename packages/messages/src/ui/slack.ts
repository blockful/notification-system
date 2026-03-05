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
    listHeader: '*Add your wallet address*\n\nThis allows us to personalize alerts based on your governance activity and delegations.',
    selectionPrefix: '*Next step:* ',
    onboardingComplete: '🎉 You\'re all set! Stay tuned — we\'ll notify you as soon as something important happens in your DAOs.',
    emptyList: "You can add wallets and receive custom notifications related to them and the DAOs you follow!",
    instructions: "Use '/anticapture wallet add' or '/anticapture wallet remove' to manage your wallets",
    buttonAdd: 'Add Wallet',
    buttonRemove: 'Remove Wallet',
    buttonSelected: 'Selected',
    buttonSelect: 'Select',
    loadError: 'Sorry, there was an error loading your wallets. Please try again later.',
    addInstructions: '*Add a Wallet Address*\n\nTo add a wallet, use the command with your address or ENS name:',
    addExamples: '```/anticapture wallet add 0x1234...abcd```\nor\n```/anticapture wallet add vitalik.eth```',
    privacyNote: '💡 Your wallet address will be kept private',
    inputPrompt: '👛 *Please enter your address or ENS name:*',
    addSuccess: '✅ Wallet added successfully!\n{{displayName}}',
    addError: '❌ An error occurred while adding the wallet. Please try again.',
    noWalletsToRemove: "You don't have any wallets to remove.",
    removeInstructions: '*Select wallets to remove:*',
    removeWarning: '⚠️ Please select at least one wallet to remove.',
    removeSuccess: '✅ *Success!* {{message}}',
    removeError: '❌ Sorry, there was an error removing your wallets. Please try again later.',
    confirmRemoval: '🗑️ Confirm Removal'
  },

  // DAO management messages
  dao: {
    subscribeHeader: '*Select the DAOs you want to track:*',
    subscribeInstructions: 'Select the DAOs you want to track:',
    emptyList: "You can select DAOs to receive customized notifications for each one.",
    listHeader: '*Your DAO Subscriptions:*',
    buttonSubscribe: '🗳️ Subscribe to DAOs',
    buttonEdit: '✏️ Edit DAO subscriptions',
    updateInstructions: "You can update your subscriptions anytime with '/anticapture'",
    confirmButton: '✅ Confirm Selection',
    subscribeSuccess: '✅ *Success!* You\'re now tracking: {{daoList}}',
    unsubscribeAllSuccess: '✅ *Success!* You\'ve unsubscribed from all DAOs.',
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
          text: '*What is Anticapture?*\n' +
            'A governance security research, notification system and dashboard that tracks social dynamics, governance models, and contracts, ensuring security and preventing malicious capture.\n\n' +
            '*What is this bot for?*\n' +
            'Get notified about risks, changes and proposals that you care about in the DAOs you follow.\n\n' +
            'Use the `/anticapture` command to get started.\n\n' +
            '*Links that might be useful*'
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
  },

  // Main command message (shown via /anticapture)
  welcomeMessage: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '🔔 *Welcome to the Anticapture notification system!*\n\n' +
            '_Spotting the "oh no" before it hits your treasury._\n\n' +
            'You will receive alerts for:\n' +
            '• New Proposals on the DAO\n' +
            '• Proposal results when it finishes\n' +
            '• Vote reminders\n\n' +
            'Stay ahead of governance risk. Stay informed.'
        }
      },
      {
        type: 'image',
        image_url: 'https://i.imgur.com/EHA4pdf.png',
        alt_text: 'New governance proposal in the selected DAO'
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Track DAOs*\nManage which DAOs you want to monitor for proposals and votes.'
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: '🗳️ Manage DAOs', emoji: true },
          action_id: 'welcome_select_daos',
          style: 'primary'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Wallet Addresses*\nManage your wallet addresses to receive personalized alerts.'
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: '👛 Manage Wallets', emoji: true },
          action_id: 'welcome_setup_wallets',
          style: 'primary'
        }
      }
    ]
  }
};