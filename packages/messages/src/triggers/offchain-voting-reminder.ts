export const offchainVotingReminderMessages = {
  default: `⏰ Snapshot Voting Reminder - {{daoId}}

Proposal: "{{title}}"

⏱️ Time remaining: {{timeRemaining}}
📊 {{thresholdPercentage}}% of voting period has passed
🗳️ {{address}}'s vote hasn't been recorded yet

Don't miss your chance to participate!`,
  getMessageKey(_thresholdPercentage: number): string {
    return 'default';
  },

  getTemplate(_key: string): string {
    return this.default;
  },
};
