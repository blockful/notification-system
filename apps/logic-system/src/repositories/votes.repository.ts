import { AnticaptureClient, VoteWithDaoId } from '@notification-system/anticapture-client';

export class VotesRepository {
  constructor(private readonly anticaptureClient: AnticaptureClient) {}

  /**
   * Fetches recent votes from all DAOs after a given timestamp
   * @param fromTimestamp Unix timestamp to fetch votes after
   * @returns Array of vote events
   */
  async listRecentVotes(fromTimestamp: string): Promise<VoteWithDaoId[]> {
    return await this.anticaptureClient.listRecentVotesFromAllDaos(
      fromTimestamp,
      100 // Limit per DAO
    );
  }
}