import { VotingPowerDataSource, VotingPowerHistoryOnChain, ListVotingPowerHistoryOptions } from '../interfaces/voting-power.interface';
import { AnticaptureClient, ListVotingPowerHistorysQueryVariables } from '@notification-system/anticapture-client';

export class VotingPowerRepository implements VotingPowerDataSource {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async listVotingPowerHistory(options: ListVotingPowerHistoryOptions): Promise<VotingPowerHistoryOnChain[]> {
    const variables: ListVotingPowerHistorysQueryVariables = {
      // Always order by timestamp ascending for chronological processing
      orderBy: 'timestamp',
      orderDirection: 'asc',
      limit: options.limit || 100
    };
    
    // Set up where clause with required daoId
    variables.where = {
      daoId: options.daoId,
      ...options.where
    };
    
    // Add timestamp filter for incremental processing
    if (options.timestamp_gt) {
      variables.where.timestamp_gt = options.timestamp_gt;
    }
    
    return await this.anticaptureClient.listVotingPowerHistory(options.daoId, variables);
  }
}