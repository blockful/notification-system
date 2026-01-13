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
    // New delegation - previousDelegate was 0x0, now delegates to someone
    new: `✅ Delegation confirmed in {{daoId}}!
Account {{delegatorAccount}} delegated {{delta}} voting power to {{delegate}}.`,

    // Changed delegation - previousDelegate was someone, now delegates to someone else
    changed: `🔄 Delegation changed in {{daoId}}!
Account {{delegatorAccount}} changed delegation from {{previousDelegate}} to {{delegate}}.`,

    // Undelegation - previousDelegate was someone, now delegates to 0x0
    removed: `↩️ Undelegation confirmed in {{daoId}}!
Account {{delegatorAccount}} removed delegation from {{previousDelegate}}.`
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