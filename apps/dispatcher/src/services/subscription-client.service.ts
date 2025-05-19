import { ISubscriptionClient, User } from '../interfaces/subscription-client.interface';

/**
 * Implementation of the Subscription Server client
 * Handles communication with the Subscription Server API
 */
export class SubscriptionClient implements ISubscriptionClient {
  private baseUrl: string;

  /**
   * Creates a new instance of the SubscriptionClient
   * @param baseUrl Base URL of the Subscription Server API
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches all subscribers for a specific DAO
   * @param daoId The ID of the DAO
   * @returns List of subscribers
   */
  async getDaoSubscribers(daoId: string): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${daoId}`);      
    if (!response.ok) {
    throw new Error(`Failed to fetch subscribers: ${response.statusText}`);
    }
    return await response.json();
  }
} 