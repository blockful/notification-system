import { SpyConsumerManager, SpyConsumerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';
import { CollectedEvent } from '../../helpers/messaging/event-collector';
import * as amqp from 'amqplib';

/**
 * @notice Manages spy consumers for monitoring RabbitMQ message flow during integration tests
 * @dev Implements the SpyConsumerManager interface to provide non-intrusive message monitoring
 * Spy consumers intercept messages for testing purposes while ensuring original consumers can still process them
 */
export class RabbitMQSpyConsumerManager implements SpyConsumerManager {
  private spyConsumers: Map<string, amqp.Channel> = new Map();

  /**
   * @notice Creates a new RabbitMQSpyConsumerManager instance
   * @dev Initializes the spy consumer manager with a connection manager dependency
   * @param connectionManager The ConnectionManager instance for RabbitMQ operations
   */
  constructor(private connectionManager: ConnectionManager) {}

  /**
   * @notice Sets up a spy consumer for a specific queue to monitor message flow
   * @dev Creates a consumer that intercepts messages, collects them for testing, and requeues them
   * The spy consumer uses nack with requeue=true to ensure messages remain available for actual consumers
   * @param config Configuration object containing queue name and event collector for message monitoring
   * @return Promise<void> Resolves when spy consumer is successfully set up
   */
  async setupSpyConsumer(config: SpyConsumerConfig): Promise<void> {
    const connection = await this.connectionManager.getConnection();
    const channel = await connection.createChannel();
    
    // Assert the original queue exists
    await channel.assertQueue(config.queueName, { durable: true });
    
    await channel.consume(config.queueName, (msg) => {
      if (msg) {
        const event: CollectedEvent = {
          type: 'rabbitmq.message',
          source: config.queueName,
          data: JSON.parse(msg.content.toString()),
          timestamp: new Date(),
          metadata: {
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            deliveryTag: msg.fields.deliveryTag,
            redelivered: msg.fields.redelivered
          }
        };
        config.eventCollector.collect(event);
        
        // Important: We requeue the message so the actual consumer can process it
        channel.nack(msg, false, true);
      }
    }, { noAck: false });
    
    this.spyConsumers.set(config.queueName, channel);
  }

  /**
   * @notice Cleans up all spy consumer channels and clears the consumer registry
   * @dev Closes all active spy consumer channels and resets the internal state
   * @return Promise<void> Resolves when all spy consumers are successfully cleaned up
   */
  async cleanup(): Promise<void> {
    for (const [_, channel] of this.spyConsumers) {
      await channel.close();
    }
    this.spyConsumers.clear();
  }
} 