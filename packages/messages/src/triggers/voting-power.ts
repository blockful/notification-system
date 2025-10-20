export const votingPowerMessages = {
  // Delegation received messages - complete
  delegationReceived: {
    new: `🥳 {{address}} received a new delegation in {{daoId}}!
{{delegator}} delegated to {{address}}, increasing voting power by {{delta}}.`,

    removed: `🥺 A delegator just undelegated in {{daoId}}!
{{delegator}} removed their delegation from {{address}}, reducing voting power by {{delta}}.`
  },

  // Delegation sent messages (when user delegates to someone else) - complete
  delegationSent: {
    confirmed: `✅ Delegation confirmed in {{daoId}}!
Account {{delegatorAccount}} delegated {{delta}} voting power to {{delegate}}.`,

    removed: `↩️ Undelegation confirmed in {{daoId}}!
Account {{delegatorAccount}} removed {{delta}} voting power from {{delegate}}.`
  },

  // Self-delegation messages - complete
  selfDelegation: {
    confirmed: `🔄 Self-delegation confirmed in {{daoId}}!
{{address}} delegated {{delta}} voting power to themselves.

💪 Total voting power is now {{votingPower}}.`,

    removed: `🔄 Self-undelegation confirmed in {{daoId}}!
{{address}} removed {{delta}} voting power from themselves.

💪 Total voting power is now {{votingPower}}.`
  },

  // Transfer-based voting power changes - complete
  transfer: {
    increased: `📈 Voting power increased in {{daoId}}!
{{address}} gained {{delta}} voting power from token transfer activity.`,

    decreased: `📉 Voting power decreased in {{daoId}}!
{{address}} lost {{delta}} voting power from token transfer activity.`
  },

  // Generic voting power change - complete
  generic: {
    increased: `⚡ Voting power increased for {{address}} in {{daoId}}!
Voting power increased by {{delta}}.`,

    decreased: `⚡ Voting power decreased for {{address}} in {{daoId}}!
Voting power decreased by {{delta}}.`
  }
};