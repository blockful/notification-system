/**
 * Interface defining a subscriber user from the subscription system
 */
export interface User {
    id: string;
    channel: string;
    channel_user_id: string;
    created_at: Date;
    token?: string;  // Optional token for workspace authentication (e.g., Slack bot token)
  }

/**
 * Interface defining a notification for deduplication
 */
export interface Notification {
  user_id: string;
  event_id: string;
  dao_id: string;
}

/**
 * Interface for the Subscription Server client
 * Defines the contract for communication with the subscription service
 */
export interface ISubscriptionClient {
  /**
   * Fetches all subscribers for a specific DAO
   * @param daoId The ID of the DAO
   * @param eventTimestamp Optional timestamp to filter subscribers by subscription date
   * @returns List of subscribers
   */
  getDaoSubscribers(daoId: string, eventTimestamp?: string): Promise<User[]>;

  /**
   * Filters subscribers to return only those who should receive notifications
   * @param subscribers List of subscribers to check
   * @param eventId The event ID
   * @param daoId The DAO ID
   * @returns Filtered list of subscribers that should receive notifications
   */
  shouldSend(subscribers: User[], eventId: string, daoId: string): Promise<Notification[]>;

  /**
   * Filters multiple groups of subscribers in batch
   * @param requests Array of shouldSend requests
   * @returns Array of notification arrays corresponding to each request
   */
  shouldSendBatch(requests: Array<{
    subscribers: User[];
    eventId: string;
    daoId: string;
  }>): Promise<Notification[][]>;

  /**
   * Marks notifications as sent for successful deliveries
   * @param notifications List of notifications to mark as sent
   */
  markAsSent(notifications: Notification[]): Promise<void>;

  /**
   * Get users who own a specific wallet address
   * @param address The wallet address
   * @returns List of users who own the address
   */
  getWalletOwners(address: string): Promise<User[]>;

  /**
   * Get users who own specific wallet addresses (batch operation)
   * @param addresses Array of wallet addresses
   * @returns Record mapping addresses to arrays of users who own each address
   */
  getWalletOwnersBatch(addresses: string[]): Promise<Record<string, User[]>>;

  /**
   * Get all unique addresses being followed by users in a specific DAO
   * @param daoId The DAO ID
   * @returns List of unique addresses being followed
   */
  getFollowedAddresses(daoId: string): Promise<string[]>;
} 