import { ProposalDataSource, ProposalOnChain, ProposalOrNull, ListProposalsOptions } from '../interfaces/proposal.interface';
import { AnticaptureClient, ListProposalsQueryVariables } from '@notification-system/anticapture-client';

export class ProposalRepository implements ProposalDataSource {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async getById(id: string): Promise<ProposalOrNull> {
    return await this.anticaptureClient.getProposalById(id);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    const variables: ListProposalsQueryVariables = {};
    
    if (options?.status || options?.status_in || options?.daoId) {
      variables.where = {};  
      if (options.status_in && options.status_in.length > 0) {
        variables.where.status_in = options.status_in;
      } else if (options.status) {
        variables.where.status_in = [options.status];
      }
      
      if (options.daoId) {
        variables.where.daoId = options.daoId;
      }
    }
    if (options?.limit) {
      variables.limit = options.limit;
    } else {
      // Set a higher default limit to ensure we get all proposals
      variables.limit = 1000;
    }
    
    // Add ordering to get newest proposals first
    variables.orderBy = 'timestamp';
    variables.orderDirection = 'desc';
    
    return await this.anticaptureClient.listProposals(variables);
  }

} 