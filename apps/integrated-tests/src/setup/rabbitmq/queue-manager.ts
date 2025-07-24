import { QueueManager, QueueManagerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';

/**
 * @notice Manages RabbitMQ queue operations for integration tests
 * @dev Implements the QueueManager interface to provide queue setup and maintenance functionality
 * Handles queue creation, configuration, and cleanup operations through the connection manager
 */
export class RabbitMQQueueManager implements QueueManager {
  /**
   * @notice Creates a new RabbitMQQueueManager instance
   * @dev Initializes the queue manager with a connection manager dependency
   * @param connectionManager The ConnectionManager instance for RabbitMQ operations
   */
  constructor(private connectionManager: ConnectionManager) {}

  /**
   * @notice Clears all messages from a specified queue
   * @dev Creates a channel, asserts the queue exists, purges all messages, and closes the channel
   * Includes error handling with warning logs for failed operations
   * @param queueName The name of the queue to clear
   * @return Promise<void> Resolves when queue is successfully cleared or error is handled
   */
  async clearQueue(queueName: string): Promise<void> {
    try {
      const connection = await this.connectionManager.getConnection();
      const channel = await connection.createChannel();
      
      await channel.assertQueue(queueName, { durable: true });
      await channel.purgeQueue(queueName);
      await channel.close();
    } catch (error) {
      console.warn(`Failed to clear queue ${queueName}:`, error);
    }
  }

  /**
   * @notice Sets up multiple queues based on provided configurations
   * @dev Iterates through queue configurations and creates each queue with specified settings
   * Each queue is asserted with durability settings and proper channel management
   * @param queues Array of queue configuration objects containing queue names and settings
   * @return Promise<void> Resolves when all queues are successfully set up
   */
  async setupQueues(queues: QueueManagerConfig[]): Promise<void> {
    const connection = await this.connectionManager.getConnection();
    
    for (const queueConfig of queues) {
      const channel = await connection.createChannel();
      await channel.assertQueue(queueConfig.queueName, { 
        durable: queueConfig.durable ?? true 
      });
      await channel.close();
    }
  }
} 