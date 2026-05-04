/**
 * Normalized proposal data for voting reminders.
 * Both on-chain and off-chain proposals are mapped to this shape.
 */
export interface VotingReminderProposal {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTime: number;
  endTime: number;
  link?: string;
  discussion?: string;
}

/**
 * Data source interface for fetching proposals ready for voting reminders.
 * Implemented by both ProposalRepository and OffchainProposalRepository.
 */
export interface VotingReminderDataSource {
  listActiveForReminder(): Promise<VotingReminderProposal[]>;
}
