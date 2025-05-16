/**
 * Interfaces for notification handling
 * Defines the structure for notification payloads and responses
 */

export interface NotificationPayload {
  userId?: string;
  channelUserId: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface APIErrorResponse {
  statusCode: number;
  error: string;
  message: string;
} 