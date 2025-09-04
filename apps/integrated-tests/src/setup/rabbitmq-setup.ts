import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';
import { EventCollector } from '../helpers/messaging/event-collector';
import { timeouts } from '../config';

const STANDARD_QUEUES = [
  'logic-system-queue',
  'dispatcher-queue',
  'consumer-queue',
  'subscription-queue'
];

/**
 * Simplified RabbitMQ setup for tests
 * Single class, direct methods, no over-abstraction
 */
export class RabbitMQTestSetup {
  private static instance: RabbitMQTestSetup | null = null;
  private container: StartedRabbitMQContainer | null = null;
  private connection: RabbitMQConnection | null = null;
  private eventCollector = new EventCollector();
  private spyConsumers: any[] = [];
  
  // Singleton pattern for global container reuse
  static getInstance(): RabbitMQTestSetup {
    if (!this.instance) {
      this.instance = new RabbitMQTestSetup();
    }
    return this.instance;
  }

  /**
   * Start container and establish connection
   * Returns AMQP URL for services to use
   */
  async setup(existingUrl?: string): Promise<string> {
    // If already connected, return existing URL
    if (this.connection) {
      // Return the URL we're using (might be from external container)
      return existingUrl || process.env.TEST_RABBITMQ_URL || this.container?.getAmqpUrl() || '';
    }
    
    // If existing URL provided (from global setup), use it
    let amqpUrl: string;
    if (existingUrl || process.env.TEST_RABBITMQ_URL) {
      amqpUrl = existingUrl || process.env.TEST_RABBITMQ_URL!;
      console.log('Using existing RabbitMQ container');
      // Don't set this.container since we didn't create it
    } else {
      // Only create new container if no URL exists
      console.log('Starting RabbitMQ container...');
      this.container = await new RabbitMQContainer()
        .withStartupTimeout(timeouts.rabbitmq.containerStartup)
        .start();
      
      // Small delay for container initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      amqpUrl = this.container.getAmqpUrl();
    }
    
    // Connect
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    console.log('RabbitMQ ready');
    
    // Setup spy consumer if not using real Telegram
    if (!process.env.SEND_REAL_TELEGRAM) {
      await this.setupSpyConsumer('dispatcher-queue');
    }
    
    return amqpUrl;
  }

  /**
   * Clear specific queue
   */
  async clearQueue(queueName: string): Promise<void> {
    if (!this.connection) return;
    
    try {
      const channel = await this.connection.createChannel();
      await channel.assertQueue(queueName, { durable: true });
      await channel.purgeQueue(queueName);
      await channel.close();
    } catch (error) {
      console.warn(`Failed to clear queue ${queueName}:`, error);
    }
  }

  /**
   * Purge all standard queues
   */
  async purgeAllQueues(): Promise<void> {
    if (!this.connection) return;
    
    for (const queue of STANDARD_QUEUES) {
      await this.clearQueue(queue);
    }
  }

  /**
   * Setup spy consumer for testing
   */
  private async setupSpyConsumer(queueName: string): Promise<void> {
    if (!this.connection) return;
    
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    
    const consumer = await channel.consume(queueName, (msg) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        this.eventCollector.collect({
          source: queueName,
          data,
          timestamp: Date.now()
        });
        // Important: nack with requeue=true to keep message in queue for real consumer
        channel.nack(msg, false, true);
      }
    }, { noAck: false });
    
    this.spyConsumers.push({ channel, consumerTag: consumer.consumerTag });
  }

  /**
   * Wait for a specific message
   */
  async waitForMessage<T = any>(
    queueName: string,
    predicate: (message: T) => boolean,
    options?: { timeout?: number }
  ) {
    return this.eventCollector.waitForEvent<T>(
      (event) => event.source === queueName && predicate(event.data),
      options
    );
  }

  /**
   * Wait for N messages
   */
  async waitForMessageCount(
    queueName: string,
    expectedCount: number,
    options?: { timeout?: number }
  ) {
    return this.eventCollector.waitForEventCount(
      expectedCount,
      { ...options, source: queueName }
    );
  }

  /**
   * Clear collected events
   */
  clearCollectedEvents(): void {
    this.eventCollector.clear();
  }

  /**
   * Get event collector for direct access
   */
  getEventCollector(): EventCollector {
    return this.eventCollector;
  }

  /**
   * Reset state for next test
   */
  async reset(): Promise<void> {
    this.eventCollector.clear();
    await this.clearQueue('dispatcher-queue');
  }

  /**
   * Full cleanup (only for global teardown)
   */
  async cleanup(): Promise<void> {
    // Close spy consumers
    for (const spy of this.spyConsumers) {
      if (spy.consumerTag) {
        await spy.channel.cancel(spy.consumerTag);
      }
      await spy.channel.close();
    }
    this.spyConsumers = [];
    
    // Close connection
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    
    // Stop container
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
    
    // Clear state
    this.eventCollector.clear();
    RabbitMQTestSetup.instance = null;
  }
}

// Export singleton instance and factory
export const rabbitmqSetup = RabbitMQTestSetup.getInstance();
export default RabbitMQTestSetup;