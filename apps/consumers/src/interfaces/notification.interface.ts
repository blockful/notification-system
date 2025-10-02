/**
 * Interfaces for notification handling
 * Defines the structure for notification payloads and responses
 */

export interface NotificationPayload {
  userId: string;
  channel: string;
  channelUserId: string | number;
  message: string;
  bot_token?: string; // Optional bot token for multi-workspace
  metadata?: {
    addresses?: Record<string, string>; // key: placeholder name, value: ethereum address
    transaction?: {
      hash: string;
      chainId: number;
    };
    [key: string]: any;
  };
}

export interface APIErrorResponse {
  statusCode: number;
  error: string;
  message: string;
} 