import type { OffchainProposalItem } from '@notification-system/anticapture-client';

export type OffchainProposal = OffchainProposalItem & { daoId: string };

export interface ListOffchainProposalsOptions {
  /** Filter by state (e.g., "active", "pending") */
  status?: string | string[];
  /** Filter proposals created after this date (timestamp in seconds) */
  fromDate?: number;
  /** Filter proposals with end >= this timestamp (seconds) */
  endDate?: number;
  /** Maximum number of proposals to return */
  limit?: number;
  /** Order direction - asc or desc */
  orderDirection?: string;
}

export interface OffchainProposalDataSource {
  listAll(options?: ListOffchainProposalsOptions): Promise<OffchainProposal[]>;
}
