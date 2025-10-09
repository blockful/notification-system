import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';
import { Consumer } from 'rabbitmq-client';
import { EventCollector } from '../helpers/messaging/event-collector';
import { timeouts } from '../config';
import { env } from '../config/env';

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
  private spyConsumers: { consumer: Consumer }[] = [];
  
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
    if (!env.SEND_REAL_TELEGRAM) {
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
      await this.connection.queuePurge(queueName);
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
    
    const conn = this.connection.getConnection();
    if (!conn) return;
    
    // Spy consumer that observes messages but requeues them for real consumer
    const consumer = conn.createConsumer(
      {
        queue: queueName,
        queueOptions: { durable: true },
        qos: { prefetchCount: 1 }
      },
      async (msg) => {
        const data = JSON.parse(msg.body.toString());
        this.eventCollector.collect({
          source: queueName,
          data,
          timestamp: Date.now()
        });
        // Return 1 = BasicNack(requeue=true) - message goes back to queue
        return 1;
      }
    );
    
    // Ignore errors from requeue (they're expected)
    consumer.on('error', () => {});
    
    this.spyConsumers.push({ consumer });
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
      if (spy.consumer) {
        await spy.consumer.close();
      }
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