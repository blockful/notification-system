import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { ContainerManager } from '../types/rabbitmq-setup.types';
import { timeouts } from '../../config';

/**
 * @notice Manages RabbitMQ Docker container lifecycle for integration tests
 * @dev Implements the ContainerManager interface to provide containerized RabbitMQ instances
 * Uses testcontainers library to spin up and manage RabbitMQ containers with proper initialization timing
 */
export class RabbitMQContainerManager implements ContainerManager {
  private container: StartedRabbitMQContainer | null = null;
  private isStarted = false;

  /**
   * @notice Retrieves or starts a RabbitMQ container instance
   * @dev Returns existing container if already started, otherwise creates and starts a new one
   * Includes startup timeout configuration and initialization wait period for container readiness
   * @return Promise<{ getAmqpUrl(): string }> Container instance with AMQP URL access method
   */
  async getContainer(): Promise<{ getAmqpUrl(): string }> {
    if (this.isStarted && this.container) {
      return this.container;
    }

    console.log('Starting RabbitMQ container...');
    this.container = await new RabbitMQContainer()
      .withStartupTimeout(timeouts.rabbitmq.containerStartup)
      .start();

    // Wait for container to fully initialize
    await new Promise(resolve => setTimeout(resolve, timeouts.notification.processing));
    
    this.isStarted = true;
    console.log('RabbitMQ container started');
    
    return this.container;
  }

  /**
   * @notice Stops the RabbitMQ container and cleans up resources
   * @dev Safely stops the container if it exists and resets all state variables
   * @return Promise<void> Resolves when container cleanup is complete
   */
  async cleanup(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
    this.isStarted = false;
  }
} 