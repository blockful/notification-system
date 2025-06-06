import axios, { AxiosInstance } from 'axios';
import { ISubscriptionClient, User, Notification } from '../interfaces/subscription-client.interface';

/**
 * Implementation of the Subscription Server client
 * Handles communication with the Subscription Server API
 */
export class SubscriptionClient implements ISubscriptionClient {
  private client: AxiosInstance;

  /**
   * Creates a new instance of the SubscriptionClient
   * @param baseUrl Base URL of the Subscription Server API
   */
  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetches all subscribers for a specific DAO
   * @param daoId The ID of the DAO
   * @returns List of subscribers
   */
  async getDaoSubscribers(daoId: string): Promise<User[]> {
    const response = await this.client.get(`/subscriptions/${daoId}`);
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

    const response = await this.client.post('/notifications/should-send', {
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