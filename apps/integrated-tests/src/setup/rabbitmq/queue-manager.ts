import { QueueManager, QueueManagerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';

export class RabbitMQQueueManager implements QueueManager {
  constructor(private connectionManager: ConnectionManager) {}

  async clearQueue(queueName: string): Promise<void> {
    try {
      const connection = await this.connectionManager.getConnection();
      const channel = await connection.createChannel();
      
      await channel.assertQueue(queueName, { durable: true });
      await channel.purgeQueue(queueName);
      await channel.close();
    } catch (error) {
      console.warn(`Failed to clear queue ${queueName}:`, error);
    }
  }

  async setupQueues(queues: QueueManagerConfig[]): Promise<void> {
    const connection = await this.connectionManager.getConnection();
    
    for (const queueConfig of queues) {
      const channel = await connection.createChannel();
      await channel.assertQueue(queueConfig.queueName, { 
        durable: queueConfig.durable ?? true 
      });
      await channel.close();
    }
  }
} 