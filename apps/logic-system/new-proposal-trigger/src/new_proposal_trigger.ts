/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and publishes them to a message queue
 * for further processing.
 * 
 * @module new_proposal_trigger
 */

import { Trigger } from '../../core/interfaces/trigger';
import { Proposal_On_Chain, List_Proposals_Options } from './interfaces/proposal_repository';
import { Queue_Repository, Message } from './interfaces/queue_repository';

const TRIGGER_ID = 'new_proposal_trigger';
const MESSAGES = {
  SUCCESS: 'New proposal sent to the queue.',
  NO_PROPOSALS: 'There are no new proposals.',
  ERROR_FETCHING: 'Error fetching proposals:',
  ERROR_PUBLISHING: 'Error publishing message:'
} as const;

export class NewProposalTrigger implements Trigger<Proposal_On_Chain, List_Proposals_Options> {
  public readonly id: string;
  public readonly interval: number;

  constructor(
    private readonly queue_repository: Queue_Repository,
    interval: number
  ) {
    this.id = TRIGGER_ID;
    this.interval = interval;
  }

  async filter(data: Proposal_On_Chain[], options?: List_Proposals_Options): Promise<Proposal_On_Chain[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }
    return data.filter(proposal => proposal?.status === options.status);
  }

  async process(filteredData: Proposal_On_Chain[]): Promise<string> {
    if (filteredData.length === 0) {
      return MESSAGES.NO_PROPOSALS;
    }

    const message: Message = {
      trigger_id: this.id,
      context: JSON.stringify(filteredData.map(proposal => ({
        ...proposal,
        for_votes: proposal.for_votes.toString(),
        against_votes: proposal.against_votes.toString(),
        abstain_votes: proposal.abstain_votes.toString()
      })))
    };

    try {
      const result = await this.queue_repository.publish_message(message);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error publishing message');
      }
      
      return MESSAGES.SUCCESS;
    } catch (error) {
      console.error(`${MESSAGES.ERROR_PUBLISHING} ${error}`);
      throw error;
    }
  }
}


