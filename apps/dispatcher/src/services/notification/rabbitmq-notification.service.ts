import { INotificationClient, NotificationPayload } from "../../interfaces/notification-client.interface";
import { RabbitMQPublisher } from '@notification-system/rabbitmq-client';

/**
 * RabbitMQ notification client implementation
 * Replaces HTTP communication with message queue for sending notifications
 */
export class RabbitMQNotificationService implements INotificationClient {
  constructor(private readonly publisher: RabbitMQPublisher) {}

  /**
   * Sends a notification via RabbitMQ queue instead of HTTP
   * @param payload The notification payload
   * @throws Error if notification fails to be queued
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    await this.publisher.publish('consumer-queue', {
      type: 'NOTIFICATION_EVENT',
      payload: {
        userId: payload.userId,
        channelUserId: payload.channelUserId,
        message: payload.message,
        metadata: payload.metadata
      }
    });
  }
}