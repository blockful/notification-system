import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { RabbitMQPublisher } from '@notification-system/rabbitmq-client';

/**
 * RabbitMQ implementation of DispatcherService
 * Publishes messages to dispatcher-queue instead of using HTTP
 */
export class RabbitMQDispatcherService implements DispatcherService {
  constructor(private readonly publisher: RabbitMQPublisher) {}

  /**
   * Sends a message to the Dispatcher via RabbitMQ queue
   * @param message - Message to be dispatched
   */
  async sendMessage<T = any>(message: DispatcherMessage<T>): Promise<void> {
    await this.publisher.publish('dispatcher-queue', {
      type: 'TRIGGER_EVENT',
      payload: message
    });
  }
}