import { Consumer } from 'rabbitmq-client';
import { RabbitMQMessage, MessageHandler } from './types';
import { RabbitMQConnection } from './connections';

export class RabbitMQConsumer {
  private consumer: Consumer | null = null;
  private connection: RabbitMQConnection;
  private queueName: string;
  private isConsuming: boolean = false;

  private constructor(
    connection: RabbitMQConnection,
    queueName: string
  ) {
    this.connection = connection;
    this.queueName = queueName;
  }

  static async create(connection: RabbitMQConnection, queueName: string): Promise<RabbitMQConsumer> {
    await connection.connect();
    return new RabbitMQConsumer(connection, queueName);
  }

  async consume<T = any>(handler: MessageHandler<T>): Promise<void> {
    if (this.isConsuming) {
      console.warn('[RabbitMQConsumer] Already consuming messages');
      return;
    }

    const conn = this.connection.getConnection();
    if (!conn) {
      throw new Error('No connection available');
    }

    this.consumer = conn.createConsumer(
      {
        queue: this.queueName,
        queueOptions: { durable: true },
        qos: { prefetchCount: 1 }
      },
      async (msg) => {
        try {
          const messageContent = msg.body.toString();
          const parsedMessage: RabbitMQMessage<T> = JSON.parse(messageContent);
          await handler(parsedMessage);
        } catch (error) {
          console.error('[RabbitMQConsumer] Error in message handler:', error);
        }
      }
    );

    this.consumer.on('error', (err) => {
      console.error(`[RabbitMQConsumer] Consumer error on queue '${this.queueName}':`, err.message);
    });

    this.isConsuming = true;
    console.log(`[RabbitMQConsumer] Started consuming messages from queue: ${this.queueName}`);
  }

  async consumeFromTopic<T = any>(
    exchangeName: string,
    bindingPattern: string,
    handler: MessageHandler<T>
  ): Promise<void> {
    if (this.isConsuming) {
      console.warn('[RabbitMQConsumer] Already consuming messages');
      return;
    }

    const conn = this.connection.getConnection();
    if (!conn) {
      throw new Error('No connection available');
    }

    // Ensure exchange exists
    await conn.exchangeDeclare({
      exchange: exchangeName,
      type: 'topic',
      durable: true
    });

    // Create exclusive queue for this consumer instance
    const queueResult = await conn.queueDeclare({
      queue: this.queueName,
      durable: true,
      exclusive: false,
      autoDelete: false
    });

    // Bind queue to exchange with pattern
    await conn.queueBind({
      queue: queueResult.queue,
      exchange: exchangeName,
      routingKey: bindingPattern
    });

    this.consumer = conn.createConsumer(
      {
        queue: queueResult.queue,
        queueOptions: { durable: true },
        qos: { prefetchCount: 1 }
      },
      async (msg) => {
        try {
          const messageContent = msg.body.toString();
          const parsedMessage: RabbitMQMessage<T> = JSON.parse(messageContent);
          await handler(parsedMessage);
        } catch (error) {
          console.error('[RabbitMQConsumer] Error in message handler:', error);
        }
      }
    );

    this.consumer.on('error', (err) => {
      console.error(`[RabbitMQConsumer] Consumer error on queue '${this.queueName}':`, err.message);
    });

    this.isConsuming = true;
    console.log(`[RabbitMQConsumer] Started consuming from topic exchange '${exchangeName}' with pattern '${bindingPattern}' on queue: ${this.queueName}`);
  }

  async close(): Promise<void> {
    if (this.consumer) {
      await this.consumer.close();
      this.consumer = null;
      this.isConsuming = false;
    }
  }
}