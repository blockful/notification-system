import * as amqp from 'amqplib';
import { RabbitMQConnection } from './connection';
import { RabbitMQMessage, MessageHandler } from './types';

export class RabbitMQConsumer {
  private connection: RabbitMQConnection;
  private channel: amqp.Channel | null = null;
  private queueName: string;

  constructor(connection: RabbitMQConnection, queueName: string) {
    this.connection = connection;
    this.queueName = queueName;
  }

  async initialize(): Promise<void> {
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
    await this.channel.prefetch(1);
  }

  async consume<T = any>(handler: MessageHandler<T>): Promise<void> {
    if (!this.channel) {
      throw new Error('Consumer not initialized. Call initialize() first.');
    }

    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) {
        return;
      }
      try {
        const messageContent = msg.content.toString();
        const parsedMessage: RabbitMQMessage<T> = JSON.parse(messageContent);
        
        await handler(parsedMessage);
        
        this.channel?.ack(msg);
      } catch (error) {
        this.channel?.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    this.channel = null;
  }
}