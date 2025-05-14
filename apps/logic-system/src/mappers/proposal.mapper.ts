import { ProposalOnChain, ProposalStatus } from '../interfaces/proposal.interface';

/**
 * Maps database row data to a ProposalOnChain domain object
 */
export class ProposalMapper {
  /**
   * Maps a database row to a ProposalOnChain domain object
   * @param row - Database row data
   * @returns ProposalOnChain domain object
   */
  static fromDatabaseToEntity(row: any): ProposalOnChain {
    return {
      id: row.id,
      daoId: row.dao_id,
      proposerAccountId: row.proposer_account_id,
      targets: Array.isArray(row.targets) ? row.targets : JSON.parse(row.targets),
      values: Array.isArray(row.values) ? row.values : JSON.parse(row.values),
      signatures: Array.isArray(row.signatures) ? row.signatures : JSON.parse(row.signatures),
      calldatas: Array.isArray(row.calldatas) ? row.calldatas : JSON.parse(row.calldatas),
      startBlock: row.start_block,
      endBlock: row.end_block,
      description: row.description,
      timestamp: row.timestamp,
      status: row.status as ProposalStatus,
      forVotes: BigInt(row.for_votes),
      againstVotes: BigInt(row.against_votes),
      abstainVotes: BigInt(row.abstain_votes)
    };
  }
} 