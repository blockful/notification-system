import { ProposalDB, ProposalOnChain, ListProposalsOptions, ProposalStatus } from '../interfaces/proposal.interface';
import { AnticaptureClient } from '../api-clients/anticapture-client';
import { ProposalOnchainGraphQL } from '../interfaces/anticapture.interface';

export class ProposalRepository implements ProposalDB {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async getById(id: string): Promise<ProposalOnChain | null> {
    const proposalGraphQL = await this.anticaptureClient.getProposalById(id);
    
    if (!proposalGraphQL) {
      return null;
    }
    
    return this.transformProposal(proposalGraphQL);
  }

  async listAll(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    const variables: any = {};
    
    if (options?.status || options?.daoId) {
      variables.where = {};  
      if (options.status) {
        variables.where.status = { eq: options.status };
      }
      if (options.daoId) {
        variables.where.daoId = { eq: options.daoId };
      }
    }
    if (options?.limit) {
      variables.limit = options.limit;
    }
    if (options?.offset) {
      variables.offset = options.offset;
    }
    
    const proposalsGraphQL = await this.anticaptureClient.listProposals(variables);
    return proposalsGraphQL.map(proposal => this.transformProposal(proposal));
  }

  private transformProposal(graphQLProposal: ProposalOnchainGraphQL): ProposalOnChain {
    return {
      ...graphQLProposal,
      status: graphQLProposal.status as ProposalStatus,
      forVotes: BigInt(graphQLProposal.forVotes),
      againstVotes: BigInt(graphQLProposal.againstVotes),
      abstainVotes: BigInt(graphQLProposal.abstainVotes)
    };
  }
} 