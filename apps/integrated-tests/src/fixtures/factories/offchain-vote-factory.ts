import type { OffchainVote } from '@notification-system/anticapture-client';

export type OffchainVoteData = OffchainVote;

/**
 * @notice Factory class for creating test offchain vote data
 * @dev Provides methods to generate Snapshot-style vote objects for integration testing
 */
export class OffchainVoteFactory {
  static createVote(
    voterAddress: string,
    proposalId: string,
    overrides: Partial<OffchainVote> = {}
  ): OffchainVote {
    return {
      voter: voterAddress,
      proposalId,
      created: Math.floor(Date.now() / 1000),
      proposalTitle: 'Test Snapshot Proposal',
      reason: '',
      vp: 1500.5,
      ...overrides
    };
  }

  static createVotesForProposals(
    voterAddress: string,
    proposalIds: string[]
  ): OffchainVote[] {
    return proposalIds.map(proposalId =>
      this.createVote(voterAddress, proposalId)
    );
  }
}
