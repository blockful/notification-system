/**
 * Subscription API Service
 * Handles communication with the subscription server API for managing user preferences
 */

import axios, { AxiosInstance } from 'axios';
import { UserSubscriptionResponse, UserResponse } from '../interfaces/subscription.interface';

export class SubscriptionAPIService {
  private client: AxiosInstance;

  constructor(private readonly baseUrl: string) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Updates or creates a user subscription for a specific DAO
   * @param daoId The DAO identifier
   * @param channelUserId The user/chat ID
   * @param channel The notification channel
   * @param isActive Whether the subscription is active
   * @returns The subscription response
   */
  public async saveUserPreference(daoId: string, channelUserId: number, channel: string, isActive: boolean = true): Promise<UserSubscriptionResponse> {
    const { data } = await this.client.post(`/subscriptions/${daoId}`, {
      channel,
      channel_user_id: channelUserId.toString(),
      is_active: isActive
    });
    return data;
  }

  /**
   * Checks if a user exists by querying subscriptions
   * @param channelUserId User/chat ID
   * @param channel The notification channel
   * @param daoIds List of DAOs to check for user subscriptions
   * @returns Boolean indicating if the user has any subscriptions
   */
  public async userExists(channelUserId: number, channel: string, daoIds: string[]): Promise<boolean> {
    // For each DAO, check if the user is subscribed
    for (const daoId of daoIds) {
      const subscribers = await this.getDaoSubscribers(daoId);
      return subscribers.some(sub => 
          sub.channel === channel && 
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
    const { data } = await this.client.get(`/subscriptions/${daoId}`);
    return data;
  }

  /**
   * Gets all active DAOs that a user is subscribed to
   * @param channelUserId User/chat ID
   * @param channel The notification channel
   * @param availableDAOs List of all available DAOs to check
   * @returns Array of DAO IDs that the user is subscribed to
   */
  public async getUserPreferences(channelUserId: number, channel: string, availableDAOs: string[]): Promise<string[]> {
    const userDAOs: string[] = [];
    
    for (const daoId of availableDAOs) {
      try {
        const subscribers = await this.getDaoSubscribers(daoId);
        const isSubscribed = subscribers.some(sub => 
          sub.channel === channel && 
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
   * @param channel The notification channel
   * @returns List of user's wallet addresses
   */
  async getUserWallets(userId: string, channel: string): Promise<{ address: string; created_at: string }[]> {
    const { data } = await this.client.get(`/users/${userId}/addresses`, {
      params: { channel }
    });
    return data.map((addr: any) => ({
      address: addr.address,
      created_at: addr.created_at
    }));
  }

  /**
   * Add wallet address to user
   * @param userId The user ID
   * @param address The wallet address to add
   * @param channel The notification channel
   */
  async addUserWallet(userId: string, address: string, channel: string): Promise<void> {
    await this.client.post(`/users/${userId}/addresses`, { 
      address, 
      channel 
    });
  }

  /**
   * Remove wallet address from user
   * @param userId The user ID
   * @param address The wallet address to remove
   * @param channel The notification channel
   */
  async removeUserWallet(userId: string, address: string, channel: string): Promise<void> {
    await this.client.delete(`/users/${userId}/addresses/${encodeURIComponent(address)}`, {
      params: { channel }
    });
  }
} 