import { ProposalDB, ProposalOnChain, ListProposalsOptions, ProposalStatus } from '../interfaces/proposal.interface';
import { ProposalMapper } from '../mappers/proposal.mapper';
import { Knex } from 'knex';

export class ProposalRepository implements ProposalDB {
  private db: Knex;
  private readonly tableName = 'proposals_onchain';

  constructor(db: Knex) {
    this.db = db;
  }

  async getById(id: string): Promise<ProposalOnChain | null> {
    const proposal = await this.db(this.tableName)
      .where({ id })
      .first();
    
    if (!proposal) {
      return null;
    }
    
    return ProposalMapper.fromDatabaseToEntity(proposal);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    let query = this.db(this.tableName).select('*');
    
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
    return proposals.map(ProposalMapper.fromDatabaseToEntity);
  }
} 