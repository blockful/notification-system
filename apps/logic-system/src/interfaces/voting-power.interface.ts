import type { VotingPowerHistory, VotingPowerHistoryFilter, ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

export type VotingPowerHistoryOnChain = ProcessedVotingPowerHistory;

export interface ListVotingPowerHistoryOptions {
  /** Filter by specific DAO (required for API call) */
  daoId: string;
  /** Maximum number of records to return (optional, defaults to 100) */
  limit: number;
  /** Timestamp to filter records after (for incremental processing) */
  timestamp_gt?: string;
  /** Additional filter criteria */
  where?: VotingPowerHistoryFilter;
}

export interface VotingPowerDataSource {
  /**
   * Lists voting power history with filtering and pagination
   * @param options - Filtering and pagination options
   * @returns Array of voting power history records
   */
  listVotingPowerHistory(options: ListVotingPowerHistoryOptions): Promise<VotingPowerHistoryOnChain[]>;
}