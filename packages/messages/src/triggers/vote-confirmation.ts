export const voteConfirmationMessages = {
  // Complete messages with reason
  withReason: {
    FOR: `✅ {{address}} just voted on {{daoId}}!

{{address}} voted FOR on proposal: {{proposalTitle}} with {{votingPower}} voting power.

Reason: "{{reason}}"`,

    AGAINST: `❌ {{address}} just voted on {{daoId}}!

{{address}} voted AGAINST on proposal: {{proposalTitle}} with {{votingPower}} voting power.

Reason: "{{reason}}"`,

    ABSTAIN: `⚪ {{address}} just voted on {{daoId}}!

{{address}} voted ABSTAIN on proposal: {{proposalTitle}} with {{votingPower}} voting power.

Reason: "{{reason}}"`
  },

  // Complete messages without reason
  withoutReason: {
    FOR: `✅ {{address}} just voted on {{daoId}}!

{{address}} voted FOR on proposal: {{proposalTitle}} with {{votingPower}} voting power.`,

    AGAINST: `❌ {{address}} just voted on {{daoId}}!

{{address}} voted AGAINST on proposal: {{proposalTitle}} with {{votingPower}} voting power.`,

    ABSTAIN: `⚪ {{address}} just voted on {{daoId}}!

{{address}} voted ABSTAIN on proposal: {{proposalTitle}} with {{votingPower}} voting power.`
  },

  // Helper to convert support number to key
  getSupportKey(support: string): 'FOR' | 'AGAINST' | 'ABSTAIN' {
    const map: Record<string, 'FOR' | 'AGAINST' | 'ABSTAIN'> = {
      '0': 'AGAINST',
      '1': 'FOR',
      '2': 'ABSTAIN'
    };
    return map[support] || 'ABSTAIN';
  }
};