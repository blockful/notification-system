import { AnticaptureClient, OffchainVoteWithDaoId } from '@notification-system/anticapture-client';

export class OffchainVotesRepository {
  constructor(private readonly anticaptureClient: AnticaptureClient) {}

  /**
   * Fetches recent offchain votes from all DAOs after a given timestamp
   * @param fromTimestamp Unix timestamp to fetch votes after
   * @returns Array of offchain vote events
   */
  async listRecentOffchainVotes(fromTimestamp: number): Promise<OffchainVoteWithDaoId[]> {
    return await this.anticaptureClient.listRecentOffchainVotesFromAllDaos(
      fromTimestamp,
      100
    );
  }
}
