import { ProposalDB, ProposalOnChain, ProposalOrNull, ListProposalsOptions } from '../interfaces/proposal.interface';
import { AnticaptureClient } from '../api-clients/anticapture-client';
import type { ListProposalsQueryVariables } from '../gql/graphql';

export class ProposalRepository implements ProposalDB {
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
        variables.where.status = options.status;
      }
      if (options.daoId) {
        variables.where.daoId = options.daoId;
      }
    }
    if (options?.limit) {
      variables.limit = options.limit;
    }
    
    return await this.anticaptureClient.listProposals(variables);
  }

} 