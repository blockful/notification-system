/**
 * Interface for notification data to be sent to consumers
 */
export interface NotificationPayload {
  userId: string;
  channel: string;
  channelUserId: string;
  message: string;
}

/**
 * Interface for notification client
 * Represents a client that can send notifications to consumers
 */
export interface INotificationClient {
  /**
   * Send a notification to a specific user
   * @param payload The notification payload
   * @throws Error if notification fails to be queued/sent
   */
  sendNotification(payload: NotificationPayload): Promise<void>;
} 