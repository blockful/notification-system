import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../../interfaces/base-trigger.interface";

/**
 * Handler for processing "new-proposal" trigger messages
 */
export class NewProposalTriggerHandler implements TriggerHandler {
  /**
   * Handle a new proposal message
   * @param message The message containing proposal data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    const { daoId, proposalId, proposalTitle } = message.payload;
    
    // TODO: Implement database call to find users following this DAO
    
    // TODO: Send notifications to each follower
    
    const messageId = crypto.randomUUID();
    return {
      messageId,
      timestamp: new Date().toISOString()
    };
  }
} 