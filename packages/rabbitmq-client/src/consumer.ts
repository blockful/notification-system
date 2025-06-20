import * as amqp from 'amqplib';
import { RabbitMQMessage, MessageHandler } from './types';
import { RabbitMQConnection } from './connections';

export class RabbitMQConsumer {
  private constructor(
    private channel: amqp.Channel,
    private queueName: string
  ) {}

  static async create(connection: RabbitMQConnection, queueName: string): Promise<RabbitMQConsumer> {
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    await channel.prefetch(1);
    return new RabbitMQConsumer(channel, queueName);
  }

  async consume<T = any>(handler: MessageHandler<T>): Promise<void> {
    await this.channel.consume(this.queueName, async (msg) => {
      if (!msg) {
        return;
      }
      try {
        const messageContent = msg.content.toString();
        const parsedMessage: RabbitMQMessage<T> = JSON.parse(messageContent);
        
        await handler(parsedMessage);
        
        this.channel.ack(msg);
      } catch {
        this.channel.nack(msg, false, true);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel.close();
  }
}