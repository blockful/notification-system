import { ProposalDB, ProposalWithDAO, ProposalOrNull, ListProposalsOptions } from '../interfaces/proposal.interface';
import { AnticaptureClient, ListProposalsQueryVariables } from '@notification-system/anticapture-client';

function generateStatusVariations(status: string): string[] {
  const normalized = status.toLowerCase();
  return [
    normalized,                                                    // lowercase: "pending"
    normalized.toUpperCase(),                                      // uppercase: "PENDING"
    normalized.charAt(0).toUpperCase() + normalized.slice(1)       // title case: "Pending"
  ];
}

export class ProposalRepository implements ProposalDB {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async getById(id: string): Promise<ProposalOrNull> {
    return await this.anticaptureClient.getProposalById(id);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalWithDAO[]> {
    const variables: ListProposalsQueryVariables = {};
    
    if (options?.status) {
      variables.where = {};  
      variables.where.status_in = generateStatusVariations(options.status);
    }
    if (options?.limit) {
      variables.limit = options.limit;
    }
    
    if (options?.daoId) {
      // If specific DAO requested, query only that DAO
      const proposals = await this.anticaptureClient.listProposalsForDAO(options.daoId, variables);
      return proposals.map(proposal => ({ ...proposal, daoId: options.daoId! }));
    } else {
      // If no specific DAO, query all DAOs
      const allDAOs = await this.anticaptureClient.getDAOs();
      const allProposals: ProposalWithDAO[] = [];
      
      for (const daoId of allDAOs) {
        const proposals = await this.anticaptureClient.listProposalsForDAO(daoId, variables);
        allProposals.push(...proposals.map(proposal => ({ ...proposal, daoId })));
      }
      
      return allProposals;
    }
  }

} 