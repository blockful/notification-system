import { SpyConsumerManager, SpyConsumerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';
import { CollectedEvent } from '../../helpers/messaging/event-collector';
import { Connection, Consumer } from 'rabbitmq-client';

/**
 * @notice Manages spy consumers for monitoring RabbitMQ message flow during integration tests
 * @dev Implements the SpyConsumerManager interface to provide non-intrusive message monitoring
 * Spy consumers intercept messages for testing purposes while ensuring original consumers can still process them
 */
export class RabbitMQSpyConsumerManager implements SpyConsumerManager {
  private spyConsumers: Map<string, Consumer> = new Map();
  private connection: Connection | null = null;

  /**
   * @notice Creates a new RabbitMQSpyConsumerManager instance
   * @dev Initializes the spy consumer manager with a connection manager dependency
   * @param connectionManager The ConnectionManager instance for RabbitMQ operations
   * @param amqpUrl Optional AMQP URL for connection
   */
  constructor(private connectionManager: ConnectionManager, private amqpUrl?: string) {}

  /**
   * @notice Sets up a spy consumer for a specific queue to monitor message flow
   * @dev Creates a consumer that intercepts messages, collects them for testing, and requeues them
   * The spy consumer uses return code 1 to NACK with requeue=true
   * @param config Configuration object containing queue name and event collector for message monitoring
   * @return Promise<void> Resolves when spy consumer is successfully set up
   */
  async setupSpyConsumer(config: SpyConsumerConfig): Promise<void> {
    const url = this.amqpUrl || process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost';
    
    // Create connection if not exists
    if (!this.connection) {
      this.connection = new Connection(url);
      await this.connection.onConnect(5000);
    }
    
    // Create a spy consumer that intercepts and requeues messages
    const consumer = this.connection.createConsumer(
      {
        queue: config.queueName,
        queueOptions: {
          durable: true,
          exclusive: false,
          autoDelete: false
        },
        // Don't auto-acknowledge
        noAck: false,
        // Set prefetch to allow processing multiple messages
        qos: { prefetchCount: 10 }
      },
      async (msg) => {
        // Collect the message for testing
        const event: CollectedEvent = {
          type: 'rabbitmq.message',
          source: config.queueName,
          data: JSON.parse(msg.body.toString()),
          timestamp: new Date(),
          metadata: {
            exchange: '',
            routingKey: config.queueName,
            deliveryTag: 0,
            redelivered: false
          }
        };
        
        config.eventCollector.collect(event);
        
        // Return 1 to NACK with requeue=true
        // This ensures the message goes back to the queue for actual consumers
        return 1;
      }
    );
    
    this.spyConsumers.set(config.queueName, consumer);
  }

  /**
   * @notice Cleans up all spy consumer channels and clears the consumer registry
   * @dev Closes all active spy consumer channels and resets the internal state
   * @return Promise<void> Resolves when all spy consumers are successfully cleaned up
   */
  async cleanup(): Promise<void> {
    for (const [_, consumer] of this.spyConsumers) {
      await consumer.close();
    }
    this.spyConsumers.clear();
    
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}