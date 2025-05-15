import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";

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
    const { daoId, proposalId, proposalTitle } = message.payload;
    const subscribers = await this.getSubscribers(daoId);
    const notificationMessage = `New proposal in ${daoId}: ${proposalTitle}`;
    const metadata = {
      daoId,
      proposalId,
      proposalTitle
    };
    await this.sendNotificationsToSubscribers(subscribers, notificationMessage, metadata);
    const messageId = crypto.randomUUID();
    return {
      messageId,
      timestamp: new Date().toISOString()
    };
  }
} 