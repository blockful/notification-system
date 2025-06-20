import * as amqp from 'amqplib';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

export class RabbitMQConnection {
  private connection: AmqpConnection | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = await amqp.connect(this.url);
    }
  }

  async createChannel(): Promise<amqp.Channel> {
    if (!this.connection) {
      throw new Error('No connection available. Call connect() first.');
    }
    return this.connection.createChannel();
  }

  async createConfirmChannel(): Promise<amqp.ConfirmChannel> {
    if (!this.connection) {
      throw new Error('No connection available. Call connect() first.');
    }
    return this.connection.createConfirmChannel();
  }

  async close(): Promise<void> {
    if (!this.connection) {
      return;
    }
    await this.connection.close();
    this.connection = null;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}