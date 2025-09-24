export const votingPowerMessages = {
  // Delegation received messages - complete
  delegationReceived: {
    new: `🥳 You've received a new delegation in {{daoId}}!
{{delegator}} delegated to you, increasing your voting power by {{delta}}.

{{txLink}}`,

    removed: `🥺 A delegator just undelegated in {{daoId}}!
{{delegator}} removed their delegation, reducing your voting power by {{delta}}.

{{txLink}}`
  },

  // Delegation sent messages (when user delegates to someone else) - complete
  delegationSent: {
    confirmed: `✅ Delegation confirmed in {{daoId}}!
Account {{delegatorAccount}} delegated {{delta}} voting power to {{delegate}}.

{{txLink}}`,

    removed: `↩️ Undelegation confirmed in {{daoId}}!
Account {{delegatorAccount}} removed {{delta}} voting power from {{delegate}}.

{{txLink}}`
  },

  // Self-delegation messages - complete
  selfDelegation: {
    confirmed: `🔄 Self-delegation confirmed in {{daoId}}!
You delegated {{delta}} voting power to yourself.

💪 Your total voting power is now {{votingPower}}.

{{txLink}}`,

    removed: `🔄 Self-undelegation confirmed in {{daoId}}!
You removed {{delta}} voting power from yourself.

💪 Your total voting power is now {{votingPower}}.

{{txLink}}`
  },

  // Transfer-based voting power changes - complete
  transfer: {
    increased: `📈 Your voting power increased in {{daoId}}!
You gained {{delta}} voting power from token transfer activity.

{{txLink}}`,

    decreased: `📉 Your voting power decreased in {{daoId}}!
You lost {{delta}} voting power from token transfer activity.

{{txLink}}`
  },

  // Generic voting power change - complete
  generic: {
    changed: `⚡ Your voting power has changed in {{daoId}}!
Voting power updated by {{delta}}.

{{txLink}}`,

    activity: `⚡ Your voting power has changed in {{daoId}}!
Voting power activity detected.

{{txLink}}`
  }
};