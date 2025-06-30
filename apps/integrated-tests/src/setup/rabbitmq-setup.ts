import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { RabbitMQConnection } from '@notification-system/rabbitmq-client';

export class RabbitMQTestSetup {
  private container!: StartedRabbitMQContainer;
  private connection!: RabbitMQConnection;
  private isCreated = false;
  
  async setup(): Promise<string> {
    if (this.isCreated) return this.container.getAmqpUrl();

    this.container = await new RabbitMQContainer()
      .withStartupTimeout(90000)
      .start();
    
    const amqpUrl = this.container.getAmqpUrl();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    this.connection = new RabbitMQConnection(amqpUrl);
    await this.connection.connect();
    await this.clearQueue('dispatcher-queue');

    this.isCreated = true;
    return amqpUrl;
  }

  async cleanup(): Promise<void> {
    if (!this.isCreated) return;
    
    await this.clearQueue('dispatcher-queue');
    await this.connection.close();
    await this.container.stop();
    
    this.isCreated = false;
  }

  private async clearQueue(queueName: string): Promise<void> {
    if (!this.isCreated) return;
    
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
    await channel.purgeQueue(queueName);
    await channel.close();
  }
}