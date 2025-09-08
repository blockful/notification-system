import { AnticaptureClient, VotesOnchain } from '@notification-system/anticapture-client';

export interface VoteEvent {
  daoId: string;
  proposalId: string;
  voterAccountId: string;
  support: string;
  votingPower: string;
  timestamp: string;
  txHash: string;
  reason?: string | null;
}

export class VotesRepository {
  constructor(private readonly anticaptureClient: AnticaptureClient) {}

  /**
   * Fetches recent votes from all DAOs after a given timestamp
   * @param fromTimestamp Unix timestamp to fetch votes after
   * @returns Array of vote events
   */
  async listRecentVotes(fromTimestamp: string): Promise<VoteEvent[]> {

    const votes = await this.anticaptureClient.listRecentVotesFromAllDaos(
      fromTimestamp,
      100 // Limit per DAO
    );

    // Map to VoteEvent interface - filter out votes without required fields
    return votes
      .filter(vote => vote.proposalId) // Only include votes with proposalId
      .map(vote => ({
        daoId: vote.daoId,
        proposalId: vote.proposalId!,
        voterAccountId: vote.voterAccountId,
        support: vote.support || '1',
        votingPower: vote.votingPower || '0',
        timestamp: vote.timestamp || '0',
        txHash: vote.txHash || '',
        reason: vote.reason
      }));
  }
}