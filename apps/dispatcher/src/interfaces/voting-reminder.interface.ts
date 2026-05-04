export interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
  link?: string;
  discussion?: string;
}

export interface NonVotersSource {
  getNonVoters(proposalId: string, daoId: string, addresses: string[]): Promise<{ voter: string }[]>;
}

export interface VotingReminderMessageSet {
  getMessageKey(thresholdPercentage: number): string;
  getTemplate(key: string): string;
}
