import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../../interfaces/base-trigger.interface";
import { ISubscriptionClient, Subscriber } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification";
import { INotificationClient } from "../../interfaces/notification-client.interface";

/**
 * Base class for trigger handlers
 * Provides common functionality for all trigger handlers
 */
export abstract class BaseTriggerHandler implements TriggerHandler {
  /**
   * Creates a new instance of the BaseTriggerHandler
   * @param subscriptionClient Client for subscription server API
   * @param notificationFactory Factory for creating notification clients
   */
  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory
  ) {}

  /**
   * Handle a trigger message
   * @param message The message to process
   */
  abstract handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult>;

  /**
   * Gets subscribers for a specific DAO
   * @param daoId DAO identifier
   * @returns List of subscribers
   */
  protected async getSubscribers(daoId: string): Promise<Subscriber[]> {
    return this.subscriptionClient.getDaoSubscribers(daoId);
  }

  /**
   * Sends notifications to all subscribers
   * @param subscribers List of subscribers
   * @param message Notification message
   * @param metadata Additional metadata
   * @returns Array of notification results
   */
  protected async sendNotificationsToSubscribers(
    subscribers: Subscriber[],
    message: string,
    metadata: Record<string, any> = {}
  ) {
    const notificationPromises = subscribers
        .filter(subscriber => {
        return this.notificationFactory.supportsChannel(subscriber.channel);
        })
        .map(async subscriber => {
        const notificationClient = this.getNotificationClient(subscriber.channel);
        return await notificationClient.sendNotification({
            userId: subscriber.id,
            channel: subscriber.channel,
            channelUserId: subscriber.channel_user_id,
            message,
            metadata
        });
        });
    return Promise.all(notificationPromises);
  }

  /**
   * Gets a notification client for a specific channel
   * @param channel Channel type
   * @returns Notification client
   */
  protected getNotificationClient(channel: string): INotificationClient {
    return this.notificationFactory.getClient(channel);
  }
} 