export const proposalFinishedMessages = {
  // Complete messages WITH title
  withTitle: {
    EXECUTED: `📊 Proposal "{{title}}" has ended on DAO {{daoId}}

Status: Executed ✅
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    SUCCEEDED: `📊 Proposal "{{title}}" has ended on DAO {{daoId}}

Status: Succeeded ✅
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    DEFEATED: `📊 Proposal "{{title}}" has ended on DAO {{daoId}}

Status: Defeated ❌
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    EXPIRED: `📊 Proposal "{{title}}" has ended on DAO {{daoId}}

Status: Expired ⏰
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    CANCELED: `📊 Proposal "{{title}}" has ended on DAO {{daoId}}

Status: Canceled 🚫
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`
  },

  // Complete messages WITHOUT title
  withoutTitle: {
    EXECUTED: `📊 A proposal has ended on DAO {{daoId}}

Status: Executed ✅
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    SUCCEEDED: `📊 A proposal has ended on DAO {{daoId}}

Status: Succeeded ✅
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    DEFEATED: `📊 A proposal has ended on DAO {{daoId}}

Status: Defeated ❌
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    EXPIRED: `📊 A proposal has ended on DAO {{daoId}}

Status: Expired ⏰
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`,

    CANCELED: `📊 A proposal has ended on DAO {{daoId}}

Status: Canceled 🚫
Votes: {{forVotes}} FOR | {{againstVotes}} AGAINST | {{abstainVotes}} ABSTAIN`
  },

  // Helper to get message by status with fallback
  getMessageTemplate(hasTitle: boolean, status: string): string {
    const messageSet = hasTitle ? this.withTitle : this.withoutTitle;
    const validStatuses = ['EXECUTED', 'SUCCEEDED', 'DEFEATED', 'EXPIRED', 'CANCELED'];
    const statusKey = validStatuses.includes(status) ? status : 'SUCCEEDED';
    return messageSet[statusKey as keyof typeof messageSet];
  }
};