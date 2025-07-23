import { SpyConsumerManager, SpyConsumerConfig, ConnectionManager } from '../types/rabbitmq-setup.types';
import { CollectedEvent } from '../../helpers/event-collector';
import * as amqp from 'amqplib';

export class RabbitMQSpyConsumerManager implements SpyConsumerManager {
  private spyConsumers: Map<string, amqp.Channel> = new Map();

  constructor(private connectionManager: ConnectionManager) {}

  async setupSpyConsumer(config: SpyConsumerConfig): Promise<void> {
    const connection = await this.connectionManager.getConnection();
    const channel = await connection.createChannel();
    
    // Assert the original queue exists
    await channel.assertQueue(config.queueName, { durable: true });
    
    await channel.consume(config.queueName, (msg) => {
      if (msg) {
        const event: CollectedEvent = {
          type: 'rabbitmq.message',
          source: config.queueName,
          data: JSON.parse(msg.content.toString()),
          timestamp: new Date(),
          metadata: {
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            deliveryTag: msg.fields.deliveryTag,
            redelivered: msg.fields.redelivered
          }
        };
        config.eventCollector.collect(event);
        
        // Important: We requeue the message so the actual consumer can process it
        channel.nack(msg, false, true);
      }
    }, { noAck: false });
    
    this.spyConsumers.set(config.queueName, channel);
  }

  async cleanup(): Promise<void> {
    for (const [_, channel] of this.spyConsumers) {
      await channel.close();
    }
    this.spyConsumers.clear();
  }
} 