export const votingReminderMessages = {
  // Complete messages based on urgency
  urgent: `🚨 URGENT Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ Your vote hasn't been recorded yet

⚠️ This proposal is closing soon! Don't miss your chance to participate in governance.

Participate in governance and make your voice heard!`,

  midPeriod: `⏰ Mid-Period Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ Your vote hasn't been recorded yet

⏰ More than half of the voting period has passed. Consider casting your vote soon.

Participate in governance and make your voice heard!`,

  early: `🔔 Early Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ Your vote hasn't been recorded yet

🔔 The voting period is underway. Take your time to review and vote.

Participate in governance and make your voice heard!`,

  default: `🗳️ Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ Your vote hasn't been recorded yet

Participate in governance and make your voice heard!`,

  // Helper function to get message key based on threshold
  getMessageKey(thresholdPercentage: number): 'urgent' | 'midPeriod' | 'early' | 'default' {
    if (thresholdPercentage >= 80) return 'urgent';
    if (thresholdPercentage >= 50) return 'midPeriod';
    if (thresholdPercentage >= 30) return 'early';
    return 'default';
  },

  headers: {
    urgent: '🚨 URGENT Voting Reminder - {{daoId}}',
    midPeriod: '⏰ Mid-Period Voting Reminder - {{daoId}}',
    early: '🔔 Early Voting Reminder - {{daoId}}',
    default: '🗳️ Voting Reminder - {{daoId}}'
  },

  urgencyMessages: {
    urgent: '⚠️ This proposal is closing soon! Don\'t miss your chance to participate in governance.',
    midPeriod: '⏰ More than half of the voting period has passed. Consider casting your vote soon.',
    early: '🔔 The voting period is underway. Take your time to review and vote.',
    default: ''
  }
};