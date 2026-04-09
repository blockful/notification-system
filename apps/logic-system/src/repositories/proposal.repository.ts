import { ProposalDataSource, ProposalOnChain, ProposalOrNull, ListProposalsOptions } from '../interfaces/proposal.interface';
import { VotingReminderDataSource, VotingReminderProposal } from '../interfaces/voting-reminder.interface';
import { AnticaptureClient, ListProposalsQueryVariables, OrderDirection, QueryInput_Proposals_Status_Items } from '@notification-system/anticapture-client';
import { mapOnchainToReminderProposal } from '../mappers/proposal-reminder.mapper';

export class ProposalRepository implements ProposalDataSource, VotingReminderDataSource {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async getById(id: string): Promise<ProposalOrNull> {
    const result = await this.anticaptureClient.getProposalById(id);
    if (!result || result.__typename !== 'OnchainProposal') return null;
    return result as ProposalOnChain;
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

    // Optimistic proposal filtering - now a plain boolean
    if (options?.includeOptimisticProposals !== undefined) {
      variables.includeOptimisticProposals = options.includeOptimisticProposals;
    }

    // Pagination
    if (options?.limit) {
      variables.limit = Math.min(options.limit, limit);
    }

    if (options?.skip) {
      variables.skip = options.skip;
    }

    // Ordering
    if (options?.orderDirection) {
      variables.orderDirection = options.orderDirection;
    }

    const daoId = options?.daoId;
    const result = await this.anticaptureClient.listProposals(variables, daoId);

    // Filter out null values and ensure we return ProposalOnChain[]
    return (result || []).filter(proposal => proposal !== null) as ProposalOnChain[];
  }

  async listActiveForReminder(): Promise<VotingReminderProposal[]> {
    const proposals = await this.listAll({
      status: QueryInput_Proposals_Status_Items.Active,
      includeOptimisticProposals: false,
    });

    return proposals
      .filter(p => p.timestamp != null && p.endTimestamp != null)
      .map(mapOnchainToReminderProposal);
  }

}
