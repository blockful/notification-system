
import { AnticaptureClient, ListVotingPowerHistorysQueryVariables, ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

export class VotingPowerRepository {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async listVotingPowerHistory(timestampGt: string): Promise<ProcessedVotingPowerHistory []> {
    const variables: ListVotingPowerHistorysQueryVariables = {
      // Always order by timestamp ascending for chronological processing
      orderBy: 'timestamp',
      orderDirection: 'asc',
      limit: 100,
      where: {
        timestamp_gt: timestampGt
      }
    };
    
    return await this.anticaptureClient.listVotingPowerHistory(variables);
  }
}