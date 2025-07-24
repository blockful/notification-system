import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { ContainerManager } from '../types/rabbitmq-setup.types';
import { timeouts } from '../../config';

export class RabbitMQContainerManager implements ContainerManager {
  private container: StartedRabbitMQContainer | null = null;
  private isStarted = false;

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

  async cleanup(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
    this.isStarted = false;
  }
} 