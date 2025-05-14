import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message";
import { TriggerHandler } from "./trigger-handler";

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
    if (!daoId) {
      throw new Error("Missing daoId in payload");
    }
    
    // TODO: Implement database call to find users following this DAO
    // const followers = await daoRepository.getFollowers(daoId);
    
    // TODO: Send notifications to each follower
    // for (const follower of followers) {
    //   await notificationService.sendNotification({
    //     userId: follower.id,
    //     type: "NEW_PROPOSAL",
    //     title: "New Proposal Created",
    //     message: `A new proposal "${proposalTitle}" has been created in a DAO you follow`,
    //     data: {
    //       daoId,
    //       proposalId
    //     }
    //   });
    // }
    
    const messageId = crypto.randomUUID();
    return {
      messageId,
      timestamp: new Date().toISOString()
    };
  }
} 