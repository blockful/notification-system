import { INotificationClient, NotificationPayload, NotificationResponse } from "../../interfaces/notification-client.interface";

/**
 * Telegram notification client implementation
 * Handles sending notifications to users via the Telegram consumer
 */
export class TelegramNotificationClient implements INotificationClient {
  private readonly baseUrl: string;

  /**
   * Creates a new Telegram notification client
   * @param baseUrl Base URL of the Telegram consumer API
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Sends a notification to a user via Telegram
   * @param payload The notification payload
   * @returns The notification response
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
    const channelUserIdAsNumber = Number(payload.channelUserId);
    if (isNaN(channelUserIdAsNumber)) {
      throw new Error(`Invalid channelUserId: ${payload.channelUserId} is not a valid number`);
    }
    const response = await fetch(`${this.baseUrl}/notifications`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        userId: payload.userId,
        channelUserId: channelUserIdAsNumber,
        message: payload.message,
        metadata: payload.metadata,
    }),
    });

    if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const data = await response.json();
    return {
    id: data.id,
    status: data.status,
    timestamp: data.timestamp,
    };
  }
} 