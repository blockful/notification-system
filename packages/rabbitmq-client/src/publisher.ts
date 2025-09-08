import { Publisher } from 'rabbitmq-client';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQMessage, PublishMessage } from './types';
import { RabbitMQConnection } from './connections';

export class RabbitMQPublisher {
  private publisher: Publisher | null = null;
  private connection: RabbitMQConnection;
  private queueAssertions: Set<string> = new Set();

  private constructor(connection: RabbitMQConnection) {
    this.connection = connection;
  }

  static async create(connection: RabbitMQConnection): Promise<RabbitMQPublisher> {
    // Ensure connection is established
    await connection.connect();
    return new RabbitMQPublisher(connection);
  }

  private async ensurePublisher(): Promise<Publisher> {
    if (!this.publisher) {
      const conn = this.connection.getConnection();
      if (!conn) {
        throw new Error('No connection available');
      }
      
      this.publisher = conn.createPublisher({
        confirm: true,
        maxAttempts: 10,
        exchanges: []
      });
    }
    return this.publisher;
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

    const publisher = await this.ensurePublisher();
    
    if (!this.queueAssertions.has(queueName)) {
      const conn = this.connection.getConnection();
      if (conn) {
        await conn.queueDeclare({
          queue: queueName,
          durable: true,
          exclusive: false,
          autoDelete: false
        });
        this.queueAssertions.add(queueName);
      }
    }

    const messageBuffer = Buffer.from(JSON.stringify(fullMessage));
    
    await publisher.send(
      {
        routingKey: queueName,
        exchange: '',
        durable: true
      },
      messageBuffer
    );
  }

  async close(): Promise<void> {
    if (this.publisher) {
      await this.publisher.close();
      this.publisher = null;
    }
    this.queueAssertions.clear();
  }
}