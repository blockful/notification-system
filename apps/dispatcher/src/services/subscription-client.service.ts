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
   * @param proposalTimestamp Optional timestamp to filter subscribers by subscription date
   * @returns List of subscribers
   */
  async getDaoSubscribers(daoId: string, proposalTimestamp?: string): Promise<User[]> {
    const url = proposalTimestamp 
      ? `/subscriptions/${daoId}?proposal_timestamp=${encodeURIComponent(proposalTimestamp)}`
      : `/subscriptions/${daoId}`;
    
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
   * Marks notifications as sent for successful deliveries
   * @param notifications List of notifications to mark as sent
   */
  async markAsSent(notifications: Notification[]): Promise<void> {
    await this.client.post('/notifications/mark-sent', {
      notifications
    });
  }
} 