import { AxiosInstance } from 'axios';
import { ISubscriptionClient, User, Notification } from '../interfaces/subscription-client.interface';

/**
 * Implementation of the Subscription Server client
 * Handles communication with the Subscription Server API
 */
export class SubscriptionClient implements ISubscriptionClient {
  private client: AxiosInstance;

  /**
   * Creates a new instance of the SubscriptionClient
   * @param client Configured axios instance for API communication
   */
  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Fetches all subscribers for a specific DAO
   * @param daoId The ID of the DAO
   * @param eventTimestamp Optional timestamp to filter subscribers by subscription date
   * @param triggerType Optional trigger type to filter subscribers by notification preference
   * @returns List of subscribers
   */
  async getDaoSubscribers(daoId: string, eventTimestamp?: string, triggerType?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (eventTimestamp) params.set('proposal_timestamp', eventTimestamp);
    if (triggerType) params.set('trigger_type', triggerType);
    const queryString = params.toString();
    const url = queryString ? `/subscriptions/${daoId}?${queryString}` : `/subscriptions/${daoId}`;

    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Filters subscribers to return only those who should receive notifications
   * @param subscribers List of subscribers to check
   * @param eventId The event ID
   * @param daoId The DAO ID
   * @returns Filtered list of subscribers that should receive notifications
   */
  async shouldSend(subscribers: User[], eventId: string, daoId: string): Promise<Notification[]> {
    const notifications = subscribers.map(subscriber => ({
      user_id: subscriber.id,
      event_id: eventId,
      dao_id: daoId
    }));

    const response = await this.client.post('/notifications/exclude-sent', {
      notifications
    });

    return response.data;
  }

  /**
   * Filters multiple groups of subscribers in batch
   * @param requests Array of shouldSend requests
   * @returns Array of notification arrays corresponding to each request
   */
  async shouldSendBatch(requests: Array<{
    subscribers: User[];
    eventId: string;
    daoId: string;
  }>): Promise<Notification[][]> {
    // Flatten all notifications into one request
    const allNotifications = requests.flatMap(request =>
      request.subscribers.map(subscriber => ({
        user_id: subscriber.id,
        event_id: request.eventId,
        dao_id: request.daoId
      }))
    );

    if (allNotifications.length === 0) {
      return requests.map(() => []);
    }

    // Make single batch request
    const response = await this.client.post('/notifications/exclude-sent', {
      notifications: allNotifications
    });
    
    // Create Map for O(1) lookup and return result in one flow
    const notificationMap = new Map<string, Notification>();
    (response.data as Notification[]).forEach(notification => {
      notificationMap.set(
        `${notification.user_id}-${notification.event_id}-${notification.dao_id}`,
        notification
      );
    });
    
    // Each request becomes an array of notifications for its subscribers
    return requests.map(request =>                    // For each non-voter delegate
      request.subscribers                             // Take all users following this delegate
        .map(subscriber =>                            // For each user in this group send the notification
          notificationMap.get(`${subscriber.id}-${request.eventId}-${request.daoId}`) // O(1) lookup
        )
        .filter((notification): notification is Notification => notification !== undefined) // Remove users who shouldn't receive notification (e.g. already sent)
    );
  }

  /**
   * Marks notifications as sent for successful deliveries
   * @param notifications List of notifications to mark as sent
   */
  async markAsSent(notifications: Notification[]): Promise<void> {
    await this.client.post('/notifications/mark-sent', {
      notifications
    });
  }

  /**
   * Get users who own a specific wallet address
   * @param address The wallet address
   * @param triggerType Optional trigger type to filter users by notification preference
   * @returns List of users who own the address
   */
  async getWalletOwners(address: string, triggerType?: string): Promise<User[]> {
    const params = new URLSearchParams();
    if (triggerType) params.set('trigger_type', triggerType);
    const queryString = params.toString();
    const url = queryString
      ? `/users/by-address/${encodeURIComponent(address)}?${queryString}`
      : `/users/by-address/${encodeURIComponent(address)}`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Get users who own specific wallet addresses (batch operation)
   * @param addresses Array of wallet addresses
   * @param triggerType Optional trigger type to filter users by notification preference
   * @returns Record mapping addresses to arrays of users who own each address
   */
  async getWalletOwnersBatch(addresses: string[], triggerType?: string): Promise<Record<string, User[]>> {
    const body: { addresses: string[]; trigger_type?: string } = { addresses };
    if (triggerType) body.trigger_type = triggerType;
    const response = await this.client.post('/users/by-addresses/batch', body);
    return response.data;
  }

  /**
   * Get all unique addresses being followed by users in a specific DAO
   * @param daoId The DAO ID
   * @returns List of unique addresses being followed
   */
  async getFollowedAddresses(daoId: string): Promise<string[]> {
    const response = await this.client.get(`/dao/${encodeURIComponent(daoId)}/followed-addresses`);
    return response.data;
  }
} 