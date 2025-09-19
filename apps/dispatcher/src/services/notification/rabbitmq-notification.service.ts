import { INotificationClient, NotificationPayload } from "../../interfaces/notification-client.interface";
import { RabbitMQPublisher } from '@notification-system/rabbitmq-client';

/**
 * RabbitMQ notification client implementation
 * Uses Topic Exchange for channel-based routing
 */
export class RabbitMQNotificationService implements INotificationClient {
  private static readonly EXCHANGE_NAME = 'notifications.exchange';

  constructor(private readonly publisher: RabbitMQPublisher) {}

  /**
   * Sends a notification via RabbitMQ Topic Exchange with channel-based routing
   * @param payload The notification payload
   * @throws Error if notification fails to be queued
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    // Generate routing key based on channel and message type
    const routingKey = this.generateRoutingKey(payload.channel, payload.type || 'notification');

    await this.publisher.publishToTopic(
      RabbitMQNotificationService.EXCHANGE_NAME,
      routingKey,
      {
        type: 'NOTIFICATION_EVENT',
        payload: {
          userId: payload.userId,
          channelUserId: payload.channelUserId,
          channel: payload.channel,
          message: payload.message,
          bot_token: payload.bot_token,
          metadata: payload.metadata
        }
      }
    );
  }

  /**
   * Generates routing key following the pattern: notifications.<channel>.<event_type>
   */
  private generateRoutingKey(channel: string, eventType: string): string {
    return `notifications.${channel}.${eventType}`;
  }
}