import { AnticaptureClient } from '@notification-system/anticapture-client';
import { OffchainProposalDataSource, OffchainProposal, ListOffchainProposalsOptions } from '../interfaces/offchain-proposal.interface';

export class OffchainProposalRepository implements OffchainProposalDataSource {
  private anticaptureClient: AnticaptureClient;

  constructor(anticaptureClient: AnticaptureClient) {
    this.anticaptureClient = anticaptureClient;
  }

  async listAll(options?: ListOffchainProposalsOptions): Promise<OffchainProposal[]> {
    const variables: Record<string, any> = {};

    if (options?.status) {
      variables.status = options.status;
    }

    if (options?.fromDate) {
      variables.fromDate = options.fromDate;
    }

    if (options?.limit) {
      variables.limit = options.limit;
    }

    if (options?.orderDirection) {
      variables.orderDirection = options.orderDirection;
    }

    return await this.anticaptureClient.listOffchainProposals(variables);
  }
}
