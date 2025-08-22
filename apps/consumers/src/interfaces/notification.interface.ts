/**
 * Interfaces for notification handling
 * Defines the structure for notification payloads and responses
 */

export interface NotificationPayload {
  userId?: string;
  channelUserId: number;
  message: string;
  metadata?: {
    addresses?: Record<string, string>; // key: placeholder name, value: ethereum address
  };
}

export interface APIErrorResponse {
  statusCode: number;
  error: string;
  message: string;
} 