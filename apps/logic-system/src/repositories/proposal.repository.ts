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
    
    // Status filtering 
    if (options?.status) {
      variables.status = options.status;
    }
    
    // Date filtering
    if (options?.fromDate) {
      // Convert string timestamp to Float
      variables.fromDate = parseFloat(options.fromDate);
    }
    
    // Pagination
    if (options?.limit) {
      variables.limit = Math.min(options.limit, 100); // API max is 100
    } else {
      // Set default limit to API maximum
      variables.limit = 100;
    }
    
    if (options?.skip) {
      variables.skip = options.skip;
    }
    
    // Ordering - enum requires cast
    if (options?.orderDirection === 'asc') {
      variables.orderDirection = 'asc' as any;
    } else if (options?.orderDirection === 'desc') {
      variables.orderDirection = 'desc' as any;
    }
    
    const daoId = options?.daoId;
    const result = await this.anticaptureClient.listProposals(variables, daoId);
    
    // Filter out null values and ensure we return ProposalOnChain[]
    return (result || []).filter(proposal => proposal !== null) as ProposalOnChain[];
  }

} 