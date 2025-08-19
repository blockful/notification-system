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
    for (const proposal of message.events) {
      const { daoId, id: proposalId, title, description, timestamp } = proposal;
      const proposalTitle = title || description.split('\n')[0].replace(/^#+\s*/, '') || 'Unnamed Proposal';
      const subscribers = await this.getSubscribers(daoId, proposalId, timestamp);
      const notificationMessage = `🗳️ New governance proposal in ${daoId}: "${proposalTitle}"`;
      await this.sendNotificationsToSubscribers(subscribers, notificationMessage, proposalId, daoId);
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
} 