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
      return subscribers.some(sub => 
          sub.channel === 'telegram' && 
          sub.channel_user_id === channelUserId.toString()
      )
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

  /**
   * Gets all active DAOs that a user is subscribed to
   * @param channelUserId Telegram user/chat ID
   * @param availableDAOs List of all available DAOs to check
   * @returns Array of DAO IDs that the user is subscribed to
   */
  public async getUserPreferences(channelUserId: number, availableDAOs: string[]): Promise<string[]> {
    const userDAOs: string[] = [];
    
    for (const daoId of availableDAOs) {
      try {
        const subscribers = await this.getDaoSubscribers(daoId);
        const isSubscribed = subscribers.some(sub => 
          sub.channel === 'telegram' && 
          sub.channel_user_id === channelUserId.toString()
        );
        
        if (isSubscribed) {
          userDAOs.push(daoId.toUpperCase());
        }
      } catch (error) {
        console.error(`Error checking subscription for DAO ${daoId}:`, error);
      }
    }
    
    return userDAOs;
  }

  /**
   * Get user's wallet addresses
   * @param userId The user ID
   * @returns List of user's wallet addresses
   */
  async getUserWallets(userId: string): Promise<{ address: string; created_at: string }[]> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/addresses`);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    const addresses = await response.json();
    return addresses.map((addr: any) => ({
      address: addr.address,
      created_at: addr.created_at
    }));
  }

  /**
   * Add wallet address to user
   * @param userId The user ID
   * @param address The wallet address to add
   */
  async addUserWallet(userId: string, address: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add wallet address');
    }
  }

  /**
   * Remove wallet address from user
   * @param userId The user ID
   * @param address The wallet address to remove
   */
  async removeUserWallet(userId: string, address: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users/${userId}/addresses/${encodeURIComponent(address)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove wallet address');
    }
  }
} 