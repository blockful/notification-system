import { ProposalDataSource, ProposalOnChain, ProposalOrNull, ListProposalsOptions } from '../interfaces/proposal.interface';
import { AnticaptureClient, ListProposalsQueryVariables } from '@notification-system/anticapture-client';

function generateStatusVariations(status: string): string[] {
  const normalized = status.toLowerCase();
  return [
    normalized,                                                    // lowercase: "pending"
    normalized.toUpperCase(),                                      // uppercase: "PENDING"
    normalized.charAt(0).toUpperCase() + normalized.slice(1)       // title case: "Pending"
  ];
}

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
    
    if (options?.status || options?.daoId) {
      variables.where = {};  
      if (options.status) {
        variables.where.status_in = generateStatusVariations(options.status);
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