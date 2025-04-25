import { Pool } from 'pg';
import { ProposalDB, ProposalOnChain, ListProposalsOptions, ProposalStatus } from '../interfaces/repositories/proposal.interface';

export class PostgresProposalDB implements ProposalDB {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
    });
  }

  async getById(id: string): Promise<ProposalOnChain | null> {
    const query = `
      SELECT * FROM proposals 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToProposal(result.rows[0]);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    let query = `SELECT * FROM proposals`;
    const params: any[] = [];
    let paramIndex = 1;
    
    // Build WHERE clause based on options
    const whereConditions: string[] = [];
    
    if (options?.status) {
      whereConditions.push(`status = $${paramIndex++}`);
      params.push(options.status);
    }
    
    if (options?.daoId) {
      whereConditions.push(`dao_id = $${paramIndex++}`);
      params.push(options.daoId);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Add pagination
    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }
    
    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }
    
    const result = await this.pool.query(query, params);
    
    return result.rows.map(this.mapRowToProposal);
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