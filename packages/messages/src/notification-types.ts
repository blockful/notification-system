export const NOTIFICATION_TYPES = [
  { id: 'new-proposal',           label: 'New Proposals' },
  { id: 'new-offchain-proposal',  label: 'Offchain Proposals' },
  { id: 'proposal-finished',      label: 'Proposal Finished' },
  { id: 'non-voting',             label: 'Non-Voting Alerts' },
  { id: 'voting-reminder-30',     label: 'Voting Reminder (30%)' },
  { id: 'voting-reminder-60',     label: 'Voting Reminder (60%)' },
  { id: 'voting-reminder-90',     label: 'Voting Reminder (90%)' },
  { id: 'voting-power-changed',   label: 'Voting Power Changed' },
  { id: 'vote-confirmation',      label: 'Vote Confirmation' },
  { id: 'offchain-vote-cast',     label: 'Offchain Vote Cast' },
] as const;

export type NotificationTypeId = typeof NOTIFICATION_TYPES[number]['id'];
