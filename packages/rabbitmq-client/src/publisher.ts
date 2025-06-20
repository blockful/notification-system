import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQConnection } from './connection';
import { RabbitMQMessage } from './types';

export class RabbitMQPublisher {
  private connection: RabbitMQConnection;
  private channel: amqp.ConfirmChannel | null = null;

  constructor(connection: RabbitMQConnection) {
    this.connection = connection;
  }

  async initialize(): Promise<void> {
    this.channel = await this.connection.createConfirmChannel();
  }

  async publish<T = any>(
    queueName: string,
    message: Omit<RabbitMQMessage<T>, 'id' | 'timestamp'>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Publisher not initialized. Call initialize() first.');
    }

    const fullMessage: RabbitMQMessage<T> = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...message
    };

    await this.channel.assertQueue(queueName, { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(fullMessage));
    this.channel.sendToQueue(queueName, messageBuffer, { persistent: true });
    await this.channel.waitForConfirms();
  }

  async close(): Promise<void> {
    await this.channel?.close();
    this.channel = null;
  }
}