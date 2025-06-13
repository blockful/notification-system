import { v4 as uuidv4 } from 'uuid';

export interface ProposalData {
  id: string;
  daoId: string;
  proposerAccountId: string;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  description: string;
  timestamp: string;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}

export class ProposalFactory {
  static createProposal(daoId: string, proposalId: string, overrides?: Partial<ProposalData>): ProposalData {
    const baseProposal: ProposalData = {
      id: proposalId,
      daoId: daoId,
      proposerAccountId: uuidv4(),
      targets: ['0xtarget1'],
      values: ['0'],
      signatures: ['transfer(address,uint256)'],
      calldatas: ['0xabcdef1234567890'],
      startBlock: 12345678,
      endBlock: 12345978,
      description: `Test ${daoId} proposal`,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      forVotes: '1000000000000000000',
      againstVotes: '500000000000000000',
      abstainVotes: '200000000000000000',
      ...overrides
    };

    return baseProposal;
  }

  static createMultipleProposals(
    daoId: string, 
    count: number, 
    baseId: string = 'proposal'
  ): ProposalData[] {
    return Array.from({ length: count }, (_, index) => 
      this.createProposal(daoId, `${baseId}-${index + 1}`)
    );
  }

  static createProposalsForMultipleDaos(
    daoIds: string[], 
    proposalId: string
  ): ProposalData[] {
    return daoIds.map(daoId => 
      this.createProposal(daoId, `${daoId.toLowerCase()}-${proposalId}`)
    );
  }
}