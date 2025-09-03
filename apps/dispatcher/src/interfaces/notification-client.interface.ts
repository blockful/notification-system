/**
 * Interface for notification data to be sent to consumers
 */
export interface NotificationPayload {
  userId: string;
  channel: string;
  channelUserId: string;
  message: string;
  metadata?: {
    addresses?: Record<string, string>; // key: placeholder name, value: ethereum address
    transaction?: {
      hash: string;
      chainId: number;
    };
    [key: string]: any;
  };
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

/**
 * Data structure for proposal finished notifications
 */
export interface ProposalFinishedNotification {
  id: string;
  daoId: string;
  title?: string;
  description: string;
  endTimestamp: number;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
}
