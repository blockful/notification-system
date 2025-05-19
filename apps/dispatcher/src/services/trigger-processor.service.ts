import { DispatcherMessage, MessageProcessingResult } from "../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../interfaces/base-trigger.interface";
import { NewProposalTriggerHandler } from "./triggers/new-proposal-trigger.service";
import { SubscriptionClient } from "./subscription-client.service";
import { NotificationClientFactory } from "./notification/notification-factory.service";

/**
 * Service responsible for processing messages for specific triggers
 */
export class TriggerProcessorService {
  private triggerHandlers: Map<string, TriggerHandler>;
  
  constructor(
    private subscriptionClient: SubscriptionClient,
    private notificationFactory: NotificationClientFactory
  ) {
    this.triggerHandlers = new Map();
    this.triggerHandlers.set(
      'new-proposal', 
      new NewProposalTriggerHandler(this.subscriptionClient, this.notificationFactory)
    );
  }

  /**
   * Process a message for a specific trigger
   * @param message The message to process
   * @returns Processing result
   * @throws Error if trigger handler not found
   */
  async processTrigger(message: DispatcherMessage): Promise<MessageProcessingResult> {
    const handler = this.triggerHandlers.get(message.triggerId);
    if (!handler) {
      throw new Error(`No handler registered for trigger: ${message.triggerId}`);
    }
    return await handler.handleMessage(message);
  }
} 