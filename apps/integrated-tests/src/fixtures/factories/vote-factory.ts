import { v4 as uuidv4 } from 'uuid';
import type { OnchainVote } from '@notification-system/anticapture-client';

export type VoteData = OnchainVote;

/**
 * Factory for creating vote test data
 */
export class VoteFactory {
  static createVote(
    voterAddress: string,
    proposalId: string,
    overrides: Partial<OnchainVote> = {}
  ): OnchainVote {
    return {
      proposalId,
      voterAddress,
      support: '1',
      timestamp: Math.floor(Date.now() / 1000),
      transactionHash: `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      votingPower: 1000000000000000000n,
      proposalTitle: 'Test Proposal',
      reason: null,
      ...overrides
    };
  }

  static createVotesForProposals(
    voterAddress: string,
    proposalIds: string[]
  ): OnchainVote[] {
    return proposalIds.map(proposalId =>
      this.createVote(voterAddress, proposalId)
    );
  }

  static createVotesFromMultipleVoters(
    voterAddresses: string[],
    proposalId: string
  ): OnchainVote[] {
    return voterAddresses.map(voterAddress =>
      this.createVote(voterAddress, proposalId)
    );
  }
}
