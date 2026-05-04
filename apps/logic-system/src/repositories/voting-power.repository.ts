import {
  AnticaptureClient,
  ListHistoricalVotingPowerQueryVariables,
  ProcessedVotingPowerHistory,
  QueryInput_HistoricalVotingPower_OrderBy,
  OrderDirection
} from '@notification-system/anticapture-client';

export class VotingPowerRepository {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async listVotingPowerHistory(timestampGt: string): Promise<ProcessedVotingPowerHistory []> {
    const variables: ListHistoricalVotingPowerQueryVariables = {
      // Always order by timestamp ascending for chronological processing
      orderBy: QueryInput_HistoricalVotingPower_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
      limit: 100,
      fromDate: parseInt(timestampGt, 10)
    };

    return await this.anticaptureClient.listVotingPowerHistory(variables);
  }
}