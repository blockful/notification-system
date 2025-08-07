import { AnticaptureClient } from '@notification-system/anticapture-client';
import { calculateProposalEndTimestamp, isProposalFinished } from '../lib/block-converter';
import { ProposalFinished } from '../interfaces/proposal.interface';

/**
 * Repository for fetching finished proposals
 */
export class ProposalFinishedRepository {
  constructor(private readonly anticaptureClient: AnticaptureClient) {}

  /**
   * Fetches proposals that have finished since the given timestamp
   * @param lastNotifiedTimestamp - Only return proposals created after this timestamp that have also finished
   * @returns Array of finished proposals
   */
  async getFinishedProposalsSince(lastNotifiedTimestamp: number): Promise<ProposalFinished[]> {
    const daos = await this.anticaptureClient.getDAOs();
    const daoPromises = daos.map(async (dao) => {
      try {
        const proposals = await this.anticaptureClient.listProposals(
          {
            where: {
              timestamp_gt: lastNotifiedTimestamp.toString()
            }
          },
          dao.id
        );

      // Filter for proposals that have finished
      const finishedProposals: ProposalFinished[] = [];
      for (const proposal of proposals) {
        if (!proposal.endBlock || !proposal.startBlock || !proposal.timestamp) continue;

        const creationTimestamp = parseInt(proposal.timestamp);
        if (isProposalFinished(creationTimestamp, proposal.startBlock, proposal.endBlock, dao.blockTime, dao.votingDelay)) {
          const endTimestamp = calculateProposalEndTimestamp(
            creationTimestamp, 
            proposal.startBlock, 
            proposal.endBlock, 
            dao.blockTime,
            dao.votingDelay
          )
          
          finishedProposals.push({
            id: proposal.id,
            daoId: dao.id,
            description: proposal.description || '',
            startBlock: proposal.startBlock,
            startTimestamp: creationTimestamp,
            endBlock: proposal.endBlock,
            endTimestamp,
            status: proposal.status || 'unknown',
            forVotes: proposal.forVotes || '0',
            againstVotes: proposal.againstVotes || '0',
            abstainVotes: proposal.abstainVotes || '0',
            blockTime: dao.blockTime,
            timestamp: creationTimestamp 
          });
        }
      }
      
      return finishedProposals;
      } catch (error) {
        console.warn(`[ProposalFinishedRepository] Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
        return []; // Return empty array for failed DAOs
      }
    });

    const allResults = await Promise.all(daoPromises);    
    const finishedProposals = allResults.flat();
    return finishedProposals.sort((a, b) => a.endTimestamp - b.endTimestamp);
    
  }

}