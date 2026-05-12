import {
  AnticaptureClient,
  HistoricalVotingPowerQueryParams,
  ProcessedVotingPowerHistory,
  historicalVotingPowerQueryParamsOrderByEnum,
  orderDirectionEnum
} from '@notification-system/anticapture-client';

export interface IVotingPowerRepository {
  listVotingPowerHistory(timestampGt: string): Promise<ProcessedVotingPowerHistory[]>;
}

export class VotingPowerRepository implements IVotingPowerRepository {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async listVotingPowerHistory(timestampGt: string): Promise<ProcessedVotingPowerHistory []> {
    const variables: HistoricalVotingPowerQueryParams = {
      // Always order by timestamp ascending for chronological processing
      orderBy: historicalVotingPowerQueryParamsOrderByEnum.timestamp,
      orderDirection: orderDirectionEnum.asc,
      limit: 100,
      fromDate: parseInt(timestampGt, 10)
    };

    return await this.anticaptureClient.listVotingPowerHistory(variables);
  }
}