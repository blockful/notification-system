import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import crypto from 'crypto';

/**
 * Handler for processing "new-proposal" trigger messages
 */
export class NewProposalTriggerHandler extends BaseTriggerHandler {
  /**
   * Creates a new instance of the NewProposalTriggerHandler
   * @param subscriptionClient Client for subscription server API
   * @param notificationFactory Factory for creating notification clients
   */
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory
  ) {
    super(subscriptionClient, notificationFactory);
  }

  /**
   * Handle a new proposal message
   * @param message The message containing proposal data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    const proposals = Array.isArray(message.payload) ? message.payload : [message.payload];
    
    for (const proposal of proposals) {
      const { daoId, id: proposalId, description } = proposal;
      const proposalTitle = description.split('\n')[0] || 'Unnamed Proposal';
      const subscribers = await this.getSubscribers(daoId);
      const notificationMessage = `🗳️ New governance proposal in ${daoId}: "${proposalTitle}"`;
      const metadata = { daoId, proposalId, proposalTitle };
      await this.sendNotificationsToSubscribers(subscribers, notificationMessage, metadata);
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
} 