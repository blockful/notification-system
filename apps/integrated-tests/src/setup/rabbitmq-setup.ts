import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';

export class RabbitMQTestSetup {
  private container: StartedRabbitMQContainer | null = null;
  private connection: RabbitMQConnection | null = null;
  
  async setup(): Promise<string> {
    this.container = await new RabbitMQContainer()
      .withStartupTimeout(90000)
      .start();
    
    const amqpUrl = this.container.getAmqpUrl();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    await this.clearQueue('dispatcher-queue');

    return amqpUrl;
  }

  async cleanup(): Promise<void> {
    if (this.connection) {
      await this.clearQueue('dispatcher-queue');
      await this.connection.close();
      this.connection = null;
    }
    
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  private async clearQueue(queueName: string): Promise<void> {
    if (!this.connection) return;
    
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    await channel.purgeQueue(queueName);
    await channel.close();
  }
}