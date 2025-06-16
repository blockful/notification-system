/**
 * Interface defining a subscriber user from the subscription system
 */
export interface User {
    id: string;
    channel: string;
    channel_user_id: string;
    created_at: Date;
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
   * @param proposalTimestamp Optional timestamp to filter subscribers by subscription date
   * @returns List of subscribers
   */
  getDaoSubscribers(daoId: string, proposalTimestamp?: string): Promise<User[]>;

  /**
   * Filters subscribers to return only those who should receive notifications
   * @param subscribers List of subscribers to check
   * @param eventId The event ID
   * @param daoId The DAO ID
   * @returns Filtered list of subscribers that should receive notifications
   */
  shouldSend(subscribers: User[], eventId: string, daoId: string): Promise<Notification[]>;

  /**
   * Marks notifications as sent for successful deliveries
   * @param notifications List of notifications to mark as sent
   */
  markAsSent(notifications: Notification[]): Promise<void>;
} 