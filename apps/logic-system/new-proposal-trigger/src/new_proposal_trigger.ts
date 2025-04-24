/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and publishes them to a message queue
 * for further processing.
 * 
 * @module new_proposal_trigger
 */

import { Proposal_Repository, List_Proposals_Options } from "./interfaces/proposal_repository";
import { Queue_Repository, Message } from './interfaces/queue_repository'

const TRIGGER_ID = 'new_proposal_trigger';
const MESSAGES = {
  SUCCESS: 'New proposal sent to the queue.',
  NO_PROPOSALS: 'There are no new proposals.',
  ERROR_FETCHING: 'Error fetching proposals:',
  ERROR_PUBLISHING: 'Error publishing message:'
} as const;

export async function new_proposal_trigger_logic(
  proposal_repository: Proposal_Repository, 
  queue_repository: Queue_Repository
): Promise<string> {
  try {
    // Get only active proposals
    const options: List_Proposals_Options = {
      status: 'active'
    };
    
    const active_proposals = await proposal_repository.list_all(options);

    if (active_proposals.length === 0) {
      return MESSAGES.NO_PROPOSALS;
    }

    const message: Message = {
      trigger_id: TRIGGER_ID,
      context: JSON.stringify(active_proposals
        .map(proposal => proposal && {
          ...proposal,
          for_votes: proposal.for_votes.toString(),
          against_votes: proposal.against_votes.toString(),
          abstain_votes: proposal.abstain_votes.toString()
        })
        .filter(Boolean)
      )
    };

    try {
      const result = await queue_repository.publish_message(message);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error publishing message');
      }
      
      return MESSAGES.SUCCESS;
    } catch (error) {
      console.error(`${MESSAGES.ERROR_PUBLISHING} ${error}`);
      throw error;
    }
  } catch (error) {
    console.error(`${MESSAGES.ERROR_FETCHING} ${error}`);
    throw error;
  }
}


