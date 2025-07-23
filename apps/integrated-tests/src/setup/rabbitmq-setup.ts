import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';
import { EventCollector, CollectedEvent } from '../helpers/event-collector';
import * as amqp from 'amqplib';

/**
 * Global singleton RabbitMQ setup for all tests
 * This ensures we only create one container for the entire test suite
 */
class GlobalRabbitMQSetup {
  private container: StartedRabbitMQContainer | null = null;
  private connection: RabbitMQConnection | null = null;
  private isStarted = false;
  private eventCollector = new EventCollector();
  private spyConsumers: Map<string, amqp.Channel> = new Map();
  
  async getOrCreateSetup(): Promise<{
    amqpUrl: string;
    eventCollector: EventCollector;
    cleanup: () => Promise<void>;
    reset: () => void;
  }> {
    if (this.isStarted && this.container && this.connection) {
      return {
        amqpUrl: this.container.getAmqpUrl(),
        eventCollector: this.eventCollector,
        cleanup: this.clearQueue.bind(this) as () => Promise<void>,
        reset: this.reset.bind(this)
      };
    }

    console.log('Starting global RabbitMQ container...');
    this.container = await new RabbitMQContainer()
      .withStartupTimeout(150000) 
      .start();
    
    const amqpUrl = this.container.getAmqpUrl();
    console.log('RabbitMQ container started, connecting...');
    
    // Wait a bit for container to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    
    // Setup initial queues and spy consumers
    await this.setupInitialQueues();
    
    this.isStarted = true;
    console.log('Global RabbitMQ setup complete');
    
    return {
      amqpUrl,
      eventCollector: this.eventCollector,
      cleanup: this.clearQueue.bind(this) as () => Promise<void>,
      reset: this.reset.bind(this)
    };
  }

  private async setupInitialQueues(): Promise<void> {
    if (!this.connection) throw new Error('Connection not established');
    
    await this.clearQueue('dispatcher-queue');
    await this.setupSpyConsumer('dispatcher-queue');
  }

  private async clearQueue(queueName: string): Promise<void> {
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

  private async setupSpyConsumer(queueName: string): Promise<void> {
    if (!this.connection) return;
    
    const channel = await this.connection.createChannel();
    
    // Assert the original queue exists
    await channel.assertQueue(queueName, { durable: true });
    
    await channel.consume(queueName, (msg) => {
      if (msg) {
        const event: CollectedEvent = {
          type: 'rabbitmq.message',
          source: queueName,
          data: JSON.parse(msg.content.toString()),
          timestamp: new Date(),
          metadata: {
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            deliveryTag: msg.fields.deliveryTag,
            redelivered: msg.fields.redelivered
          }
        };
        this.eventCollector.collect(event);
        
        // Important: We requeue the message so the actual consumer can process it
        channel.nack(msg, false, true);
      }
    }, { noAck: false });
    
    this.spyConsumers.set(queueName, channel);
  }

  private reset(): void {
    this.eventCollector.clear();
  }

  async globalCleanup(): Promise<void> {
    if (!this.isStarted) return;
    
    // Close spy consumers
    for (const [_, channel] of this.spyConsumers) {
      await channel.close();
    }
    this.spyConsumers.clear();
    
    if (this.connection) {
      await this.connection.close();
    }
    
    if (this.container) {
      await this.container.stop();
    }

    this.isStarted = false;
    this.container = null;
    this.connection = null;

  }
}

// Global singleton instance
const globalRabbitMQSetup = new GlobalRabbitMQSetup();

export class RabbitMQTestSetup {
  private amqpUrl!: string;
  private eventCollector!: EventCollector;
  private cleanupQueue!: () => Promise<void>;
  private reset!: () => void;
  private isSetup = false;
  private connection: RabbitMQConnection | null = null;
  
  async setup(): Promise<string> {
    if (this.isSetup) return this.amqpUrl;

    const globalSetup = await globalRabbitMQSetup.getOrCreateSetup();
    this.amqpUrl = globalSetup.amqpUrl;
    this.eventCollector = globalSetup.eventCollector;
    this.cleanupQueue = globalSetup.cleanup;
    this.reset = globalSetup.reset;
    this.isSetup = true;
    
    return this.amqpUrl;
  }
  
  async setupWithExistingContainer(amqpUrl: string): Promise<void> {
    if (this.isSetup) return;
    
    this.amqpUrl = amqpUrl;
    this.eventCollector = new EventCollector();
    
    // Connect to existing RabbitMQ
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    
    // Setup spy consumer for dispatcher queue
    await this.setupSpyConsumer('dispatcher-queue');
    
    this.cleanupQueue = this.clearQueue.bind(this);
    this.reset = () => this.eventCollector.clear();
    this.isSetup = true;
  }
  
  private async setupSpyConsumer(queueName: string): Promise<void> {
    if (!this.connection) return;
    
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    
    await channel.consume(queueName, (msg) => {
      if (msg) {
        const event: CollectedEvent = {
          type: 'rabbitmq.message',
          source: queueName,
          data: JSON.parse(msg.content.toString()),
          timestamp: new Date(),
          metadata: {
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            deliveryTag: msg.fields.deliveryTag,
            redelivered: msg.fields.redelivered
          }
        };
        this.eventCollector.collect(event);
        
        // Requeue the message so the actual consumer can process it
        channel.nack(msg, false, true);
      }
    }, { noAck: false });
  }
  
  private async clearQueue(queueName: string = 'dispatcher-queue'): Promise<void> {
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

  async cleanup(): Promise<void> {
    if (!this.isSetup) return;
    await this.cleanupQueue();
  }

  getEventCollector(): EventCollector {
    return this.eventCollector;
  }

  async waitForMessage<T = any>(
    queueName: string,
    predicate: (message: T) => boolean,
    options?: { timeout?: number }
  ): Promise<CollectedEvent<T>> {
    return this.eventCollector.waitForEvent<T>(
      (event) => event.source === queueName && predicate(event.data),
      options
    );
  }

  async waitForMessageCount(
    queueName: string,
    expectedCount: number,
    options?: { timeout?: number }
  ): Promise<CollectedEvent[]> {
    return this.eventCollector.waitForEventCount(
      expectedCount,
      { ...options, source: queueName }
    );
  }

  clearCollectedEvents(): void {
    this.reset();
  }
}

// Export the global cleanup function for Jest teardown
export { globalRabbitMQSetup };