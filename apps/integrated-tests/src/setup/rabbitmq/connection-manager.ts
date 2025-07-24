import { RabbitMQConnection } from '@notification-system/rabbitmq-client';
import { ConnectionManager } from '../types/rabbitmq-setup.types';

/**
 * @notice Manages RabbitMQ connection lifecycle for integration tests
 * @dev Implements the ConnectionManager interface to provide centralized connection management
 * This class ensures a single connection instance is maintained throughout the test lifecycle
 */
export class RabbitMQConnectionManager implements ConnectionManager {
  private connection: RabbitMQConnection | null = null;

  /**
   * @notice Retrieves the current RabbitMQ connection instance
   * @dev Returns the existing connection if initialized, otherwise throws an error
   * @return Promise<RabbitMQConnection> The active RabbitMQ connection instance
   * @throws Error if connection hasn't been initialized via initialize() method
   */
  async getConnection(): Promise<RabbitMQConnection> {
    if (this.connection) {
      return this.connection;
    }

    throw new Error('Connection not initialized. Call initialize() first.');
  }

  /**
   * @notice Initializes and establishes connection to RabbitMQ server
   * @dev Creates a new RabbitMQConnection instance and establishes the connection
   * @param amqpUrl The AMQP connection URL for the RabbitMQ server
   * @return Promise<void> Resolves when connection is successfully established
   */
  async initialize(amqpUrl: string): Promise<void> {
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    console.log('RabbitMQ connection established');
  }

  /**
   * @notice Closes the RabbitMQ connection and cleans up resources
   * @dev Safely closes the connection if it exists and resets the connection reference to null
   * @return Promise<void> Resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
} 