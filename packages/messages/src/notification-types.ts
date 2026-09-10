export enum NotificationTypeId {
  NewProposal = 'new-proposal',
  NewOffchainProposal = 'new-offchain-proposal',
  ProposalFinished = 'proposal-finished',
  NonVoting = 'non-voting',
  VotingReminder30 = 'voting-reminder-30',
  VotingReminder60 = 'voting-reminder-60',
  VotingReminder90 = 'voting-reminder-90',
  VotingPowerChanged = 'voting-power-changed',
  VoteConfirmation = 'vote-confirmation',
  OffchainVoteCast = 'offchain-vote-cast',
  OffchainProposalFinished = 'offchain-proposal-finished',
  OffchainVotingReminder50 = 'offchain-voting-reminder-50',
  ProposalExecutable = 'proposal-executable',
}

export const NOTIFICATION_TYPES: Record<NotificationTypeId, string> = {
  [NotificationTypeId.NewProposal]: 'New Proposals',
  [NotificationTypeId.NewOffchainProposal]: 'Offchain Proposals',
  [NotificationTypeId.ProposalFinished]: 'Proposal Finished',
  [NotificationTypeId.NonVoting]: 'Non-Voting Alerts',
  [NotificationTypeId.VotingReminder30]: 'Vote Reminder 30%',
  [NotificationTypeId.VotingReminder60]: 'Vote Reminder 60%',
  [NotificationTypeId.VotingReminder90]: 'Vote Reminder 90%',
  [NotificationTypeId.VotingPowerChanged]: 'Voting Power',
  [NotificationTypeId.VoteConfirmation]: 'Vote Confirmation',
  [NotificationTypeId.OffchainVoteCast]: 'Offchain Vote',
  [NotificationTypeId.OffchainProposalFinished]: 'Offchain Proposal Finished',
  [NotificationTypeId.OffchainVotingReminder50]: 'Offchain Vote Reminder 50%',
  [NotificationTypeId.ProposalExecutable]: 'Proposal Executable',
};

/** Types that only machine (webhook) subscribers consume; hidden from Telegram/Slack settings. */
const INTERNAL_NOTIFICATION_TYPES: ReadonlySet<NotificationTypeId> = new Set([
  NotificationTypeId.ProposalExecutable,
]);

export const USER_FACING_NOTIFICATION_TYPES: readonly NotificationTypeId[] =
  Object.values(NotificationTypeId).filter(id => !INTERNAL_NOTIFICATION_TYPES.has(id));
