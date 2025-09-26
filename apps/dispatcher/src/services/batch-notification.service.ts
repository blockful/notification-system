import { ISubscriptionClient, User, Notification } from '../interfaces/subscription-client.interface';
import { NotificationClientFactory } from './notification/notification-factory.service';

/**
 * Service for handling batch notification processing
 * Provides reusable batch operations for sending notifications efficiently
 */
export class BatchNotificationService {
  constructor(
    private readonly subscriptionClient: ISubscriptionClient,
    private readonly notificationFactory: NotificationClientFactory
  ) {}

  /**
   * Prepares batch data by fetching followers and applying deduplication
   * @param addresses - Addresses to process (e.g., non-voting addresses)
   * @param daoId - DAO identifier
   * @param eventIdGenerator - Function to generate unique event IDs for each address
   * @returns Prepared batch data with followers and notifications to send
   */
  async prepareBatchData(
    addresses: string[], 
    daoId: string, 
    eventIdGenerator: (address: string) => string
  ): Promise<BatchNotificationData[]> {
    // Batch fetch all followers for all addresses in a single request
    const addressFollowersMap = await this.subscriptionClient.getWalletOwnersBatch(addresses);
    const addressFollowers = addresses
      .map(address => ({ address, followers: addressFollowersMap[address] || [] }))
      .filter(af => af.followers.length > 0);
    
    if (addressFollowers.length === 0) {
      return [];
    }

    // Batch check deduplication for all addresses in one request
    const shouldSendRequests = addressFollowers.map(({ address, followers }) => ({
      subscribers: followers,
      eventId: eventIdGenerator(address),
      daoId
    }));
    
    const batchResults = await this.subscriptionClient.shouldSendBatch(shouldSendRequests);
    
    // Map results back to the original structure
    return addressFollowers.map(({ address, followers }, index) => ({
      address,
      followers,
      notificationsToSend: batchResults[index] || []
    }));
  }

  /**
   * Filters batch data to only include items with notifications to send
   * @param batchData - Batch data from prepareBatchData
   * @returns Filtered data with valid notifications
   */
  filterValidNotifications(batchData: BatchNotificationData[]): BatchNotificationData[] {
    return batchData.filter(result => result.notificationsToSend.length > 0);
  }

  /**
   * Executes parallel sending of notifications and marks them as sent
   * @param validNotifications - Notifications ready to be sent
   * @param messageGenerator - Function to generate message for each address
   * @param metadataGenerator - Optional function to generate metadata for each notification
   */
  async executeBatchSend(
    validNotifications: BatchNotificationData[],
    messageGenerator: (address: string) => string,
    metadataGenerator?: (address: string) => Record<string, any>
  ): Promise<void> {
    const sendPromises: Promise<void>[] = [];
    const allNotificationsToMark: Notification[] = [];

    for (const { address, followers, notificationsToSend } of validNotifications) {
      const followerMap = new Map(followers.map((f: User) => [f.id, f]));
      const message = messageGenerator(address);
      const metadata = metadataGenerator ? metadataGenerator(address) : undefined;
      
      this.queueNotificationSends(
        notificationsToSend, 
        followerMap, 
        message, 
        metadata,
        sendPromises
      );
      
      allNotificationsToMark.push(...notificationsToSend);
    }

    // Execute all sends in parallel and mark as sent
    await Promise.all([
      Promise.all(sendPromises),
      this.subscriptionClient.markAsSent(allNotificationsToMark)
    ]);
  }

  /**
   * Queues individual notification sends for parallel execution
   * @param notificationsToSend - Notifications to queue
   * @param followerMap - Map of follower IDs to follower data
   * @param message - Formatted notification message
   * @param metadata - Optional metadata for the notification
   * @param sendPromises - Array to collect send promises
   */
  private queueNotificationSends(
    notificationsToSend: Notification[], 
    followerMap: Map<string, User>, 
    message: string, 
    metadata: Record<string, any> | undefined,
    sendPromises: Promise<void>[]
  ): void {
    for (const notification of notificationsToSend) {
      const follower = followerMap.get(notification.user_id);
      if (!follower) continue;

      sendPromises.push(
        this.notificationFactory
          .getClient(follower.channel)
          .sendNotification({
            userId: follower.id,
            channel: follower.channel,
            channelUserId: follower.channel_user_id,
            message,
            bot_token: follower.token,
            metadata
          })
          .catch(error => {
            console.error(`Failed to send notification to user ${follower.id}:`, error);
          })
      );
    }
  }

  /**
   * Simplified method to send notifications to multiple addresses
   * Combines prepare, filter, and execute steps
   * @param addresses - Addresses to process
   * @param daoId - DAO identifier
   * @param eventIdGenerator - Function to generate unique event IDs
   * @param messageGenerator - Function to generate messages
   * @param metadataGenerator - Optional function to generate metadata
   */
  async sendBatchNotifications(
    addresses: string[],
    daoId: string,
    eventIdGenerator: (address: string) => string,
    messageGenerator: (address: string) => string,
    metadataGenerator?: (address: string) => Record<string, any>
  ): Promise<void> {
    const batchData = await this.prepareBatchData(addresses, daoId, eventIdGenerator);
    const validNotifications = this.filterValidNotifications(batchData);
    
    if (validNotifications.length === 0) {
      return;
    }

    await this.executeBatchSend(validNotifications, messageGenerator, metadataGenerator);
  }
}

/**
 * Interface for batch notification data
 */
export interface BatchNotificationData {
  address: string;
  followers: User[];
  notificationsToSend: Notification[];
}