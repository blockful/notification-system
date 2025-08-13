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
    
    if (options?.status || options?.status_in || options?.daoId || options?.timestamp_gt || options?.endTimestamp_gt) {
      variables.where = {};  
      if (options.status_in && options.status_in.length > 0) {
        variables.where.status_in = options.status_in;
      } else if (options.status) {
        variables.where.status_in = [options.status];
      }
      
      if (options.daoId) {
        variables.where.daoId = options.daoId;
      }
      
      if (options.timestamp_gt) {
        variables.where.timestamp_gt = options.timestamp_gt;
      }
      
      if (options.endTimestamp_gt) {
        variables.where.endTimestamp_gt = options.endTimestamp_gt;
      }
    }
    if (options?.limit) {
      variables.limit = options.limit;
    } else {
      // Set a higher default limit to ensure we get all proposals
      variables.limit = 1000;
    }
    
    // Add ordering - default to timestamp desc if not specified
    variables.orderBy = options?.orderBy || 'timestamp';
    variables.orderDirection = options?.orderDirection || 'desc';
    
    return await this.anticaptureClient.listProposals(variables);
  }

} 