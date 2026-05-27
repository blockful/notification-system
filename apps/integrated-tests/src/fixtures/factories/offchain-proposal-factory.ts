import { type OffchainProposal } from '@notification-system/anticapture-client';

export type OffchainProposalData = OffchainProposal;

/**
 * @notice Factory class for creating test offchain proposal data
 * @dev Provides methods to generate Snapshot-style proposal objects for integration testing
 * @dev The `daoId` parameter populates the SDK `spaceId` field — for Snapshot data
 * @dev the production wrapper enriches each item with a `daoId` field separately
 */
export class OffchainProposalFactory {
  static createProposal(
    daoId: string,
    proposalId: string,
    overrides?: Partial<OffchainProposal>
  ): OffchainProposal {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 5;

    return {
      id: proposalId,
      spaceId: daoId,
      author: '0x1111111111111111111111111111111111111111',
      title: `Test Snapshot Proposal ${proposalId}`,
      body: '',
      discussion: '',
      type: 'single-choice',
      start: futureTimestamp,
      end: futureTimestamp + 7 * 24 * 60 * 60,
      state: 'active',
      created: futureTimestamp,
      updated: futureTimestamp,
      link: '',
      flagged: false,
      scores: [],
      choices: ['For', 'Against'],
      network: '1',
      snapshot: null,
      strategies: [],
      ...overrides
    };
  }

  static createMultipleProposals(
    daoId: string,
    count: number,
    baseId: string = 'snap-proposal'
  ): OffchainProposal[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return Array.from({ length: count }, (_, index) =>
      this.createProposal(daoId, `${baseId}-${index + 1}`, {
        created: baseTime + index * 10
      })
    );
  }
}
