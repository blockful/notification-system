export const voteConfirmationMessages = {
  // Complete messages with reason
  withReason: {
    FOR: `✅ Your vote just went through on {{daoId}}!

You voted FOR on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Your reason: "{{reason}}"

{{txLink}}`,

    AGAINST: `❌ Your vote just went through on {{daoId}}!

You voted AGAINST on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Your reason: "{{reason}}"

{{txLink}}`,

    ABSTAIN: `⚪ Your vote just went through on {{daoId}}!

You voted ABSTAIN on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

Your reason: "{{reason}}"

{{txLink}}`
  },

  // Complete messages without reason
  withoutReason: {
    FOR: `✅ Your vote just went through on {{daoId}}!

You voted FOR on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

{{txLink}}`,

    AGAINST: `❌ Your vote just went through on {{daoId}}!

You voted AGAINST on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

{{txLink}}`,

    ABSTAIN: `⚪ Your vote just went through on {{daoId}}!

You voted ABSTAIN on proposal #{{proposalIdShort}} with {{votingPower}} voting power.

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