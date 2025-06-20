import * as amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQMessage, PublishMessage } from './types';
import { RabbitMQConnection } from './connections';

export class RabbitMQPublisher {
  private constructor(private channel: amqp.ConfirmChannel) {}

  static async create(connection: RabbitMQConnection): Promise<RabbitMQPublisher> {
    const channel = await connection.createConfirmChannel();
    return new RabbitMQPublisher(channel);
  }

  async publish<T = any>(
    queueName: string,
    message: PublishMessage<T>
  ): Promise<void> {
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
    await this.channel.close();
  }
}