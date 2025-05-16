/**
 * Subscription API Service
 * Handles communication with the subscription server API for managing user preferences
 */

import { UserSubscriptionResponse, UserResponse } from '../interfaces/subscription.interface';

export class SubscriptionAPIService {
  constructor(private readonly baseUrl: string) {}

  /**
   * Updates or creates a user subscription for a specific DAO
   * @param daoId The DAO identifier
   * @param channelUserId The Telegram user/chat ID
   * @param isActive Whether the subscription is active
   * @returns The subscription response
   */
  public async saveUserPreference(daoId: string, channelUserId: number, isActive: boolean = true): Promise<UserSubscriptionResponse> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${daoId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        channel: 'telegram',
        channel_user_id: channelUserId.toString(),
        is_active: isActive
    })
    });
    if (!response.ok) {
    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as UserSubscriptionResponse;
  }

  /**
   * Checks if a user exists by querying subscriptions
   * @param channelUserId Telegram user/chat ID
   * @param daoIds List of DAOs to check for user subscriptions
   * @returns Boolean indicating if the user has any subscriptions
   */
  public async userExists(channelUserId: number, daoIds: string[]): Promise<boolean> {
    // For each DAO, check if the user is subscribed
    for (const daoId of daoIds) {
      const subscribers = await this.getDaoSubscribers(daoId);
      if (subscribers.some(sub => 
          sub.channel === 'telegram' && 
          sub.channel_user_id === channelUserId.toString() &&
          sub.is_active
      )) {
          return true;
      }
    }
    return false;
  }

  /**
   * Gets all subscribers for a specific DAO
   * @param daoId The DAO identifier
   * @returns List of subscribers
   */
  private async getDaoSubscribers(daoId: string): Promise<UserResponse[]> {
    const response = await fetch(`${this.baseUrl}/subscriptions/${daoId}`);
    if (!response.ok) {
    throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as UserResponse[];
  }
} 