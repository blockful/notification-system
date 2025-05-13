import { ProposalDB, ProposalOnChain, ListProposalsOptions, ProposalStatus } from '../interfaces/proposal.interface';
import { Knex } from 'knex';

export class PostgresProposalDB implements ProposalDB {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  async getById(id: string): Promise<ProposalOnChain | null> {
    const proposal = await this.db('proposals')
      .where({ id })
      .first();
    
    if (!proposal) {
      return null;
    }
    
    return this.mapRowToProposal(proposal);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    let query = this.db('proposals').select('*');
    
    if (options?.status) {
      query = query.where('status', options.status);
    }
    
    if (options?.daoId) {
      query = query.where('dao_id', options.daoId);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const proposals = await query;
    return proposals.map(this.mapRowToProposal);
  }

  private mapRowToProposal(row: any): ProposalOnChain {
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