import {
  AnticaptureClient,
  ListHistoricalVotingPowerQueryVariables,
  ProcessedVotingPowerHistory,
  QueryInput_HistoricalVotingPower_OrderBy,
  QueryInput_HistoricalVotingPower_OrderDirection
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
      orderDirection: QueryInput_HistoricalVotingPower_OrderDirection.Asc,
      limit: 100,
      fromDate: timestampGt
    };

    return await this.anticaptureClient.listVotingPowerHistory(variables);
  }
}