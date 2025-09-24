export const delegationChangeMessages = {
  // Regular delegation confirmation
  confirmed: `✅ Delegation confirmed on DAO {{daoId}}

You delegated {{delegatedAmount}} voting power to {{delegate}}.

Your remaining voting power: {{remainingPower}}
Total delegation from you: {{totalDelegated}}

Transaction: {{txLink}}`,

  // Self-delegation confirmation
  selfDelegation: `🔄 Self-delegation confirmed on DAO {{daoId}}

You delegated {{delegatedAmount}} voting power to yourself.

Your total voting power is now: {{totalPower}}

Transaction: {{txLink}}`,

  // Undelegation confirmation (when removing delegation)
  undelegation: `↩️ Undelegation confirmed on DAO {{daoId}}

You removed {{undelegatedAmount}} voting power delegation from {{previousDelegate}}.

Your voting power is now: {{currentPower}}

Transaction: {{txLink}}`,

  // When someone delegates TO you
  receivedDelegation: `📨 New delegation received on DAO {{daoId}}

{{delegator}} has delegated {{delegatedAmount}} voting power to you!

Your total voting power is now: {{totalPower}}

Transaction: {{txLink}}`,

  // When someone removes delegation FROM you
  lostDelegation: `📤 Delegation removed on DAO {{daoId}}

{{delegator}} has removed {{undelegatedAmount}} voting power delegation from you.

Your total voting power is now: {{totalPower}}

Transaction: {{txLink}}`
};