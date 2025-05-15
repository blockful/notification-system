import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../../interfaces/base-trigger.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";

/**
 * Handler for processing "new-proposal" trigger messages
 */
export class NewProposalTriggerHandler implements TriggerHandler {
  /**
   * Creates a new instance of the NewProposalTriggerHandler
   * @param subscriptionClient Client for subscription server API
   */
  constructor(private readonly subscriptionClient: ISubscriptionClient) {}

  /**
   * Handle a new proposal message
   * @param message The message containing proposal data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    const { daoId, proposalId, proposalTitle } = message.payload;
    const subscribers = await this.subscriptionClient.getDaoSubscribers(daoId);
    
    // TODO: Send notifications to each follower
    
    const messageId = crypto.randomUUID();
    return {
      messageId,
      timestamp: new Date().toISOString()
    };
  }
} 