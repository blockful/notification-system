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
  ERROR_SENDING: 'Error sending message to API:'
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

  async filter(data: ProposalOnChain[], options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }
    return data.filter(proposal => proposal?.status === options.status);
  }

  async process(filteredData: ProposalOnChain[]): Promise<string> {
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