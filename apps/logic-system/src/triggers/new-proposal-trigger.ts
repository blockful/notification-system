/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to an API endpoint
 * for further processing.
 */

import { Trigger } from '../interfaces/core/trigger.interface';
import { ProposalOnChain, ListProposalsOptions } from '../interfaces/repositories/proposal-repository.interface';
import { ApiRepository, ApiMessage } from '../interfaces/repositories/api-repository.interface';

const triggerId = 'newProposalTrigger';
const MESSAGES = {
  SUCCESS: 'New proposal sent to the API.',
  NO_PROPOSALS: 'There are no new proposals.',
  ERROR_FETCHING: 'Error fetching proposals:',
  ERROR_SENDING: 'Error sending message to API:',
  STATUS_REQUIRED: 'Status is required in filter options'
} as const;

export class NewProposalTrigger implements Trigger<ProposalOnChain, ListProposalsOptions> {
  public readonly id: string;
  public readonly interval: number;

  constructor(
    private readonly apiRepository: ApiRepository,
    interval: number
  ) {
    this.id = triggerId;
    this.interval = interval;
  }

  private filterData(data: ProposalOnChain[], options?: ListProposalsOptions): ProposalOnChain[] {
    if (!options?.status) {
      throw new Error(MESSAGES.STATUS_REQUIRED);
    }
    return data.filter(proposal => proposal?.status === options.status);
  }

  async process(data: ProposalOnChain[], options?: ListProposalsOptions): Promise<string> {
    // Filtrar os dados antes de processá-los
    const filteredData = this.filterData(data, options);
    
    if (filteredData.length === 0) {
      return MESSAGES.NO_PROPOSALS;
    }

    const message: ApiMessage = {
      triggerId: this.id,
      context: JSON.stringify(filteredData.map(proposal => ({
        ...proposal,
        forVotes: proposal.forVotes.toString(),
        againstVotes: proposal.againstVotes.toString(),
        abstainVotes: proposal.abstainVotes.toString()
      })))
    };

    try {
      const result = await this.apiRepository.sendMessage(message);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error sending message to API');
      }
      
      return MESSAGES.SUCCESS;
    } catch (error) {
      console.error(`${MESSAGES.ERROR_SENDING} ${error}`);
      throw error;
    }
  }
} 