import { EventCollector, CollectedEvent } from '../helpers/messaging/event-collector';
import { RabbitMQContainerManager } from './rabbitmq/container-manager';
import { RabbitMQConnectionManager } from './rabbitmq/connection-manager';
import { RabbitMQQueueManager } from './rabbitmq/queue-manager';
import { RabbitMQSpyConsumerManager } from './rabbitmq/spy-consumer';
import { RabbitMQSetupConfig } from './types/rabbitmq-setup.types';

/**
 * Global singleton RabbitMQ setup for all tests
 * This ensures we only create one container for the entire test suite
 */
class GlobalRabbitMQSetup {
  private containerManager = new RabbitMQContainerManager();
  private connectionManager = new RabbitMQConnectionManager();
  private queueManager = new RabbitMQQueueManager(this.connectionManager);
  private spyConsumerManager = new RabbitMQSpyConsumerManager(this.connectionManager);
  private eventCollector = new EventCollector();
  private isStarted = false;
  
  async getOrCreateSetup(): Promise<RabbitMQSetupConfig> {
    if (this.isStarted) {
      const container = await this.containerManager.getContainer();
      return {
        amqpUrl: container.getAmqpUrl(),
        eventCollector: this.eventCollector,
        cleanup: () => this.queueManager.clearQueue('dispatcher-queue'),
        reset: () => this.eventCollector.clear()
      };
    }

    console.log('Starting global RabbitMQ container...');
    
    // Setup container and connection
    const container = await this.containerManager.getContainer();
    const amqpUrl = container.getAmqpUrl();
    await this.connectionManager.initialize(amqpUrl);
    
    // Setup initial queues and spy consumers
    await this.setupInitialQueues();
    
    this.isStarted = true;
    console.log('Global RabbitMQ setup complete');
    
    return {
      amqpUrl,
      eventCollector: this.eventCollector,
      cleanup: () => this.queueManager.clearQueue('dispatcher-queue'),
      reset: () => this.eventCollector.clear()
    };
  }

  private async setupInitialQueues(): Promise<void> {
    await this.queueManager.clearQueue('dispatcher-queue');
    
    // Only setup spy consumer if not using real Telegram
    // Spy consumers interfere with real message processing
    if (!process.env.SEND_REAL_TELEGRAM) {
      await this.spyConsumerManager.setupSpyConsumer({
        queueName: 'dispatcher-queue',
        eventCollector: this.eventCollector
      });
    }
  }

  async globalCleanup(): Promise<void> {
    if (!this.isStarted) return;
    
    await this.spyConsumerManager.cleanup();
    await this.connectionManager.cleanup();
    await this.containerManager.cleanup();

    this.isStarted = false;
    this.eventCollector.clear();
  }
}

// Global singleton instance
const globalRabbitMQSetup = new GlobalRabbitMQSetup();

export class RabbitMQTestSetup {
  private connectionManager: RabbitMQConnectionManager | null = null;
  private queueManager: RabbitMQQueueManager | null = null;
  private spyConsumerManager: RabbitMQSpyConsumerManager | null = null;
  private eventCollector: EventCollector | null = null;
  private amqpUrl = '';
  private isSetup = false;
  
  async setup(): Promise<string> {
    if (this.isSetup) return this.amqpUrl;

    const globalSetup = await globalRabbitMQSetup.getOrCreateSetup();
    this.amqpUrl = globalSetup.amqpUrl;
    this.eventCollector = globalSetup.eventCollector;
    this.isSetup = true;
    
    return this.amqpUrl;
  }
  
  async setupWithExistingContainer(amqpUrl: string): Promise<void> {
    if (this.isSetup) return;
    
    this.amqpUrl = amqpUrl;
    this.eventCollector = new EventCollector();
    
    // Setup managers for existing container
    this.connectionManager = new RabbitMQConnectionManager();
    await this.connectionManager.initialize(amqpUrl);
    
    this.queueManager = new RabbitMQQueueManager(this.connectionManager);
    this.spyConsumerManager = new RabbitMQSpyConsumerManager(this.connectionManager);
    
    // Only setup spy consumer if not using real Telegram
    // Spy consumers interfere with real message processing
    if (!process.env.SEND_REAL_TELEGRAM) {
      await this.spyConsumerManager.setupSpyConsumer({
        queueName: 'dispatcher-queue',
        eventCollector: this.eventCollector
      });
    }
    
    this.isSetup = true;
  }

  async cleanup(): Promise<void> {
    if (!this.isSetup) return;
    
    if (this.queueManager) {
      await this.queueManager.clearQueue('dispatcher-queue');
    }
    
    if (this.spyConsumerManager) {
      await this.spyConsumerManager.cleanup();
    }
    
    if (this.connectionManager) {
      await this.connectionManager.cleanup();
    }
    
    this.connectionManager = null;
    this.queueManager = null;
    this.spyConsumerManager = null;
    this.eventCollector = null;
    this.isSetup = false;
  }

  getEventCollector(): EventCollector {
    if (!this.eventCollector) {
      throw new Error('Setup not initialized. Call setup() or setupWithExistingContainer() first.');
    }
    return this.eventCollector;
  }

  async waitForMessage<T = any>(
    queueName: string,
    predicate: (message: T) => boolean,
    options?: { timeout?: number }
  ): Promise<CollectedEvent<T>> {
    const eventCollector = this.getEventCollector();
    return eventCollector.waitForEvent<T>(
      (event) => event.source === queueName && predicate(event.data),
      options
    );
  }

  async waitForMessageCount(
    queueName: string,
    expectedCount: number,
    options?: { timeout?: number }
  ): Promise<CollectedEvent[]> {
    const eventCollector = this.getEventCollector();
    return eventCollector.waitForEventCount(
      expectedCount,
      { ...options, source: queueName }
    );
  }

  clearCollectedEvents(): void {
    this.getEventCollector().clear();
  }

  /**
   * Purge all queues to ensure clean state between tests
   * This removes all messages from the queues
   */
  async purgeAllQueues(): Promise<void> {
    if (!this.connection) {
      return;
    }

    const channel = await this.connection.createChannel();
    
    const queues = [
      'logic-system-queue',
      'dispatcher-queue', 
      'consumer-queue',
      'subscription-queue'
    ];

    for (const queueName of queues) {
      try {
        // Assert queue exists and purge it
        await channel.checkQueue(queueName);
        await channel.purgeQueue(queueName);
        console.log(`Purged queue: ${queueName}`);
      } catch (error) {
        // Queue might not exist, that's ok
        console.log(`Could not purge queue ${queueName}:`, error);
      }
    }

    await channel.close();
  }
}

// Export the global cleanup function for Jest teardown
export { globalRabbitMQSetup };