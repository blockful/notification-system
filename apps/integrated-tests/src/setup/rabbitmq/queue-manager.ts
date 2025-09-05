import { QueueManager, QueueManagerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';
import { Connection } from 'rabbitmq-client';

/**
 * @notice Manages RabbitMQ queue operations for integration tests
 * @dev Implements the QueueManager interface to provide queue setup and maintenance functionality
 * Handles queue creation, configuration, and cleanup operations through the connection manager
 */
export class RabbitMQQueueManager implements QueueManager {
  private connection: Connection | null = null;
  
  /**
   * @notice Creates a new RabbitMQQueueManager instance
   * @dev Initializes the queue manager with a connection manager dependency
   * @param connectionManager The ConnectionManager instance for RabbitMQ operations
   * @param amqpUrl Optional AMQP URL for connection
   */
  constructor(private connectionManager: ConnectionManager, private amqpUrl?: string) {}

  /**
   * @notice Gets or creates a rabbitmq-client connection for queue management
   * @dev Uses rabbitmq-client for all queue operations
   * @return Promise<Connection> The rabbitmq-client connection
   */
  private async getConnection(): Promise<Connection> {
    if (!this.connection) {
      const url = this.amqpUrl || process.env.TEST_RABBITMQ_URL || 'amqp://guest:guest@localhost';
      
      this.connection = new Connection(url);
      await this.connection.onConnect(5000);
    }
    return this.connection;
  }

  /**
   * @notice Clears all messages from a specified queue
   * @dev Creates the queue if it doesn't exist, then purges all messages
   * Includes error handling with warning logs for failed operations
   * @param queueName The name of the queue to clear
   * @return Promise<void> Resolves when queue is successfully cleared or error is handled
   */
  async clearQueue(queueName: string): Promise<void> {
    try {
      const connection = await this.getConnection();
      
      // First ensure the queue exists
      await connection.queueDeclare({
        queue: queueName,
        durable: true,
        exclusive: false,
        autoDelete: false
      });
      
      // Then purge all messages from it
      await connection.queuePurge({ queue: queueName });
    } catch (error) {
      console.warn(`[QueueManager] Failed to clear queue ${queueName}:`, error);
    }
  }

  /**
   * @notice Sets up multiple queues based on provided configurations
   * @dev Iterates through queue configurations and creates each queue with specified settings
   * Each queue is asserted with durability settings
   * @param queues Array of queue configuration objects containing queue names and settings
   * @return Promise<void> Resolves when all queues are successfully set up
   */
  async setupQueues(queues: QueueManagerConfig[]): Promise<void> {
    const connection = await this.getConnection();
    
    for (const queueConfig of queues) {
      await connection.queueDeclare({
        queue: queueConfig.queueName,
        durable: queueConfig.durable ?? true,
        exclusive: false,
        autoDelete: false
      });
    }
  }
  
  /**
   * @notice Cleans up the rabbitmq-client connection
   * @dev Closes the connection if it exists
   * @return Promise<void> Resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}