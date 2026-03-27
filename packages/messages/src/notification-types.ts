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
};
