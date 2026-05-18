import { type OnchainProposal } from '@notification-system/anticapture-client';

export type ProposalData = OnchainProposal;

/**
 * @notice Factory class for creating test proposal data
 * @dev Provides methods to generate realistic proposal objects for integration testing
 */
export class ProposalFactory {
  static createProposal(
    daoId: string,
    proposalId: string,
    overrides?: Partial<OnchainProposal>
  ): OnchainProposal {
    const now = Math.floor(Date.now() / 1000) + 1;
    return {
      id: proposalId,
      daoId,
      proposerAccountId: '0x1111111111111111111111111111111111111111',
      title: `Test ${daoId} proposal`,
      description: `Test ${daoId} proposal`,
      targets: ['0xtarget1'],
      values: ['0'],
      calldatas: ['0xabcdef1234567890'],
      startBlock: 12345678,
      endBlock: 12345978,
      startTimestamp: now,
      endTimestamp: now + 300,
      timestamp: now,
      status: 'ACTIVE',
      forVotes: '1000000000000000000',
      againstVotes: '500000000000000000',
      abstainVotes: '200000000000000000',
      quorum: '0',
      proposalType: null,
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ...overrides
    };
  }

  static createMultipleProposals(
    daoId: string,
    count: number,
    baseId: string = 'proposal'
  ): OnchainProposal[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return Array.from({ length: count }, (_, index) =>
      this.createProposal(daoId, `${baseId}-${index + 1}`, {
        timestamp: baseTime + index * 10
      })
    );
  }

  static createProposalsForMultipleDaos(
    daoIds: string[],
    proposalId: string
  ): OnchainProposal[] {
    const baseTime = Math.floor(Date.now() / 1000) + 100;
    return daoIds.map((daoId, index) =>
      this.createProposal(daoId, `${daoId.toLowerCase()}-${proposalId}`, {
        timestamp: baseTime + index * 10
      })
    );
  }
}
