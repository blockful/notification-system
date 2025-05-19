/**
 * Interface defining a subscriber user from the subscription system
 */
export interface User {
    id: string;
    channel: string;
    channel_user_id: string;
    is_active: boolean;
    created_at: Date;
  }

/**
 * Interface for the Subscription Server client
 * Defines the contract for communication with the subscription service
 */
export interface ISubscriptionClient {
  /**
   * Fetches all subscribers for a specific DAO
   * @param daoId The ID of the DAO
   * @returns List of subscribers
   */
  getDaoSubscribers(daoId: string): Promise<User[]>;
} 