export const delegationChangeMessages = {
  // Regular delegation confirmation
  confirmed: `✅ Delegation confirmed on DAO {{daoId}}

{{address}} delegated {{delegatedAmount}} voting power to {{delegate}}.

Remaining voting power: {{remainingPower}}
Total delegation from {{address}}: {{totalDelegated}}

Transaction: {{txLink}}`,

  // Self-delegation confirmation
  selfDelegation: `🔄 Self-delegation confirmed on DAO {{daoId}}

{{address}} delegated {{delegatedAmount}} voting power to themselves.

Total voting power is now: {{totalPower}}

Transaction: {{txLink}}`,

  // Undelegation confirmation (when removing delegation)
  undelegation: `↩️ Undelegation confirmed on DAO {{daoId}}

{{address}} removed {{undelegatedAmount}} voting power delegation from {{previousDelegate}}.

Voting power is now: {{currentPower}}

Transaction: {{txLink}}`,

  // When someone delegates TO you
  receivedDelegation: `📨 New delegation received on DAO {{daoId}}

{{delegator}} has delegated {{delegatedAmount}} voting power to {{address}}!

Total voting power is now: {{totalPower}}

Transaction: {{txLink}}`,

  // When someone removes delegation FROM you
  lostDelegation: `📤 Delegation removed on DAO {{daoId}}

{{delegator}} has removed {{undelegatedAmount}} voting power delegation from {{address}}.

Total voting power is now: {{totalPower}}

Transaction: {{txLink}}`
};