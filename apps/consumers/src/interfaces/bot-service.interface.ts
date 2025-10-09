/**
 * Common interface for all bot services (Telegram, Slack, Discord, etc.)
 * This interface defines the contract that any notification bot service must implement
 */

import { NotificationPayload } from './notification.interface';

export interface BotServiceInterface {
  /**
   * Send a notification to a user through the specific channel
   * @param payload The notification payload containing message and metadata
   * @returns A unique identifier for the sent message (e.g., message ID, timestamp)
   */
  sendNotification(payload: NotificationPayload): Promise<string>;
}