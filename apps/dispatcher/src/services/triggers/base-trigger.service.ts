import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../../interfaces/base-trigger.interface";
import { ISubscriptionClient, User } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { AnticaptureClient } from '@notification-system/anticapture-client';

/**
 * Base class for trigger handlers
 * Provides common functionality for all trigger handlers
 * @template T - Type of event data being processed
 */
export abstract class BaseTriggerHandler<T = any> implements TriggerHandler<T> {
  private daoCache: Map<string, { chainId: number; alreadySupportCalldataReview: boolean }> = new Map();

  /**
   * Creates a new instance of the BaseTriggerHandler
   * @param subscriptionClient Client for subscription server API
   * @param notificationFactory Factory for creating notification clients
   * @param anticaptureClient Optional client for AntiCapture API (required for getChainIdForDao)
   */
  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    protected readonly anticaptureClient?: AnticaptureClient
  ) {}

  /**
   * Handle a trigger message
   * @param message The message to process
   */
  abstract handleMessage(message: DispatcherMessage<T>): Promise<MessageProcessingResult>;

  /**
   * Gets subscribers for a specific DAO and event (already filtered)
   * @param daoId DAO identifier
   * @param eventId Event identifier
   * @param eventTimestamp Timestamp when the proposal was created
   * @returns List of subscribers that should receive notifications
   */
  protected async getSubscribers(daoId: string, eventId: string, eventTimestamp?: string): Promise<User[]> {
    const allSubscribers = await this.subscriptionClient.getDaoSubscribers(daoId, eventTimestamp);
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
   * @param metadata Optional metadata including transaction info
   * @param buttons Optional buttons to include in the notification
   */
  protected async sendNotificationsToSubscribers(
    subscribers: User[],
    message: string,
    eventId: string,
    daoId: string,
    metadata?: { transaction?: { hash: string; chainId: number }; [key: string]: any, addresses?: Record<string, string> },
    buttons?: Array<{ text: string; url: string }>
  ): Promise<void> {
    const supportedSubscribers = subscribers.filter(subscriber =>
      this.notificationFactory.supportsChannel(subscriber.channel)
    );

    const results = await Promise.allSettled(
      supportedSubscribers.map(async subscriber => {
        const notificationClient = this.notificationFactory.getClient(subscriber.channel);

        return notificationClient.sendNotification({
          userId: subscriber.id,
          channel: subscriber.channel,
          channelUserId: subscriber.channel_user_id,
          message,
          bot_token: subscriber.token,
          metadata: buttons ? { ...metadata, buttons } : metadata
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

  /**
   * Gets the chain ID for a specific DAO, with caching
   * @param daoId DAO identifier
   * @returns Chain ID for the DAO, or 1 (Ethereum mainnet) as default
   * @throws Error if anticaptureClient is not provided
   */
  /**
   * Gets full DAO info (chainId, alreadySupportCalldataReview) with caching
   */
  protected async getDaoInfo(daoId: string): Promise<{ chainId: number; alreadySupportCalldataReview: boolean }> {
    if (!this.anticaptureClient) {
      throw new Error('AnticaptureClient is required for getDaoInfo');
    }

    if (this.daoCache.has(daoId)) {
      return this.daoCache.get(daoId)!;
    }

    const daos = await this.anticaptureClient.getDAOs();
    for (const dao of daos) {
      this.daoCache.set(dao.id, {
        chainId: dao.chainId,
        alreadySupportCalldataReview: dao.alreadySupportCalldataReview
      });
    }

    return this.daoCache.get(daoId) || { chainId: 1, alreadySupportCalldataReview: false };
  }

  /**
   * Gets the chain ID for a specific DAO, with caching
   */
  protected async getChainIdForDao(daoId: string): Promise<number> {
    const info = await this.getDaoInfo(daoId);
    return info.chainId;
  }
} 