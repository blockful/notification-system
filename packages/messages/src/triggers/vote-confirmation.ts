export const voteConfirmationMessages = {
  // Complete messages with reason
  withReason: {
    FOR: `✅ {{address}} just voted on {{daoId}}!

{{address}} voted FOR on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Reason: "{{reason}}"

{{txLink}}`,

    AGAINST: `❌ {{address}} just voted on {{daoId}}!

{{address}} voted AGAINST on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Reason: "{{reason}}"

{{txLink}}`,

    ABSTAIN: `⚪ {{address}} just voted on {{daoId}}!

{{address}} voted ABSTAIN on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Reason: "{{reason}}"

{{txLink}}`
  },

  // Complete messages without reason
  withoutReason: {
    FOR: `✅ {{address}} just voted on {{daoId}}!

{{address}} voted FOR on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

{{txLink}}`,

    AGAINST: `❌ {{address}} just voted on {{daoId}}!

{{address}} voted AGAINST on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

{{txLink}}`,

    ABSTAIN: `⚪ {{address}} just voted on {{daoId}}!

{{address}} voted ABSTAIN on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

{{txLink}}`
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