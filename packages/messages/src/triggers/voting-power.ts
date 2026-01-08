export const votingPowerMessages = {
  // Delegation received messages
  delegationReceived: {
    new: `🥳 {{address}} received a new delegation in {{daoId}}!
{{delegator}} delegated to {{address}}, increasing voting power by {{delta}}.
Voting power is now {{votingPower}}.`,

    removed: `🥺 A delegator just undelegated in {{daoId}}!
{{delegator}} removed their delegation from {{address}}, reducing voting power by {{delta}}.
Voting power is now {{votingPower}}.`
  },

  // Delegation sent messages (when user delegates to someone else)
  delegationSent: {
    confirmed: `✅ Delegation confirmed in {{daoId}}!
Account {{delegatorAccount}} delegated {{delta}} voting power to {{delegate}}.`,

    removed: `↩️ Undelegation confirmed in {{daoId}}!
Account {{delegatorAccount}} removed {{delta}} voting power from {{delegate}}.`
  },

  // Self-delegation messages
  selfDelegation: {
    confirmed: `🔄 Self-delegation confirmed in {{daoId}}!
{{address}} delegated {{delta}} voting power to themselves.

💪 Total voting power is now {{votingPower}}.`,

    removed: `🔄 Self-undelegation confirmed in {{daoId}}!
{{address}} removed {{delta}} voting power from themselves.

💪 Total voting power is now {{votingPower}}.`
  },

  // Transfer - when user is the sender or receiver of tokens
  transfer: {
    increased: `📈 Voting power increased in {{daoId}}!
{{address}} received tokens from {{counterparty}}, balance increased by {{delta}}.
Voting power is now {{votingPower}}.`,

    decreased: `📉 Voting power decreased in {{daoId}}!
{{address}} transferred tokens to {{counterparty}}, balance decreased by {{delta}}.
Voting power is now {{votingPower}}.`
  },

  // Delegator balance change - when someone who delegates to user had their balance change
  delegatorBalanceChange: {
    increased: `📈 Voting power increased in {{daoId}}!
{{delegator}}, who delegates to {{address}}, had their balance increased by {{delta}}.
Voting power is now {{votingPower}}.`,

    decreased: `📉 Voting power decreased in {{daoId}}!
{{delegator}}, who delegates to {{address}}, had their balance decreased by {{delta}}.
Voting power is now {{votingPower}}.`
  },

  // Generic voting power change
  generic: {
    increased: `⚡ Voting power increased for {{address}} in {{daoId}}!
Voting power increased by {{delta}} and now it is {{votingPower}}.`,

    decreased: `⚡ Voting power decreased for {{address}} in {{daoId}}!
Voting power decreased by {{delta}} and now it is {{votingPower}}.`
  }
};