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
   * @param proposalId The proposal ID
   * @param daoId The DAO ID
   * @returns Filtered list of subscribers that should receive notifications
   */
  async shouldSend(subscribers: User[], proposalId: string, daoId: string): Promise<Notification[]> {
    const notifications = subscribers.map(subscriber => ({
      user_id: subscriber.id,
      proposal_id: proposalId,
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
   * @returns Number of notifications marked as sent
   */
  async markAsSent(notifications: Notification[]): Promise<number> {
    const response = await this.client.post('/notifications/mark-sent', {
      notifications
    });

    return response.data.markedCount;
  }
} 