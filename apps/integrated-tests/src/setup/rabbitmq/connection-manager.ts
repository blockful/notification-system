import { RabbitMQConnection } from '@notification-system/rabbitmq-client';
import { ConnectionManager } from '../types/rabbitmq-setup.types';

export class RabbitMQConnectionManager implements ConnectionManager {
  private connection: RabbitMQConnection | null = null;

  async getConnection(): Promise<RabbitMQConnection> {
    if (this.connection) {
      return this.connection;
    }

    throw new Error('Connection not initialized. Call initialize() first.');
  }

  async initialize(amqpUrl: string): Promise<void> {
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    console.log('RabbitMQ connection established');
  }

  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
} 