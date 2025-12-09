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

  async listAll(options?: ListProposalsOptions, limit: number = 100): Promise<ProposalOnChain[]> {
    const variables: ListProposalsQueryVariables = {};
    
    // Status filtering 
    if (options?.status) {
      variables.status = options.status;
    }
    
    // Date filtering
    if (options?.fromDate) {
      variables.fromDate = options.fromDate;
    }

    if (options?.fromEndDate) {
      variables.fromEndDate = options.fromEndDate;
    }

    // Proposal type filtering
    if (options?.proposalType) {
      variables.proposalType = options.proposalType;
    }

    if (options?.proposalTypeExclude) {
      variables.proposalTypeExclude = options.proposalTypeExclude;
    }

    // Pagination
    if (options?.limit) {
      variables.limit = Math.min(options.limit, limit);
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