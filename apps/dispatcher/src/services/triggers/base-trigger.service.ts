import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../../interfaces/base-trigger.interface";
import { ISubscriptionClient, User, Notification } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
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
   * Gets subscribers for a specific DAO and event (already filtered)
   * @param daoId DAO identifier
   * @param eventId Event identifier
   * @returns List of subscribers that should receive notifications
   */
  protected async getSubscribers(daoId: string, eventId: string): Promise<User[]> {
    const allSubscribers = await this.subscriptionClient.getDaoSubscribers(daoId);
    const filteredNotifications = await this.subscriptionClient.shouldSend(allSubscribers, eventId, daoId);
    return allSubscribers.filter(subscriber => 
      filteredNotifications.some(notification => notification.user_id === subscriber.id)
    );
  }

  /**
   * Sends notifications to subscribers and marks them as sent upon success
   * @param subscribers List of subscribers (already filtered)
   * @param message Notification message
   * @param eventId Event identifier
   * @param daoId DAO identifier
   */
  protected async sendNotificationsToSubscribers(
    subscribers: User[],
    message: string,
    eventId: string,
    daoId: string
  ): Promise<void> {
    const supportedSubscribers = subscribers.filter(subscriber => 
      this.notificationFactory.supportsChannel(subscriber.channel)
    );

    const results = await Promise.allSettled(
      supportedSubscribers.map(subscriber => {
        const notificationClient = this.notificationFactory.getClient(subscriber.channel);
        return notificationClient.sendNotification({
          userId: subscriber.id,
          channel: subscriber.channel,
          channelUserId: subscriber.channel_user_id,
          message
        });
      })
    );

    const successfulSubscribers = supportedSubscribers.filter((_, index) => 
      results[index].status === 'fulfilled'
    );

    const notifications = successfulSubscribers.map(subscriber => ({
      user_id: subscriber.id,
      event_id: eventId,
      dao_id: daoId
    }));

    if (notifications.length > 0) {
      await this.subscriptionClient.markAsSent(notifications);
    }
  }
} 