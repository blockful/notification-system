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
 * Interface for notification response data
 */
export interface NotificationResponse {
  id: string;
  status: 'delivered' | 'queued' | 'failed';
  timestamp: string;
}

/**
 * Interface for notification client
 * Represents a client that can send notifications to consumers
 */
export interface INotificationClient {
  /**
   * Send a notification to a specific user
   * @param payload The notification payload
   * @returns The notification response
   */
  sendNotification(payload: NotificationPayload): Promise<NotificationResponse>;
} 