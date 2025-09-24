/**
 * Main entry point for the messages package
 */

// Export trigger messages
export { newProposalMessages } from './triggers/new-proposal';
export { voteConfirmationMessages } from './triggers/vote-confirmation';
export { votingReminderMessages } from './triggers/voting-reminder';
export { proposalFinishedMessages } from './triggers/proposal-finished';
export { votingPowerMessages } from './triggers/voting-power';
export { nonVotingMessages } from './triggers/non-voting';
export { delegationChangeMessages } from './triggers/delegation-change';

// Export UI messages
export { uiMessages } from './ui/common';
export { slackMessages } from './ui/slack';
export { telegramMessages } from './ui/telegram';

// Export formatters and utilities
export { replacePlaceholders } from './formatters/placeholders';
export type { PlaceholderMap } from './formatters/placeholders';
export { getDaoWithEmoji } from './formatters/dao-emoji';