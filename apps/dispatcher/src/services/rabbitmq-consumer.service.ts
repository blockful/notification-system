import { RabbitMQConnection, RabbitMQConsumer } from '@notification-system/rabbitmq-client';
import { TriggerProcessorService } from './trigger-processor.service';

/**
 * Service to consume messages from RabbitMQ and process them through TriggerProcessorService
 */
export class RabbitMQConsumerService {
  private connection!: RabbitMQConnection;
  private consumer!: RabbitMQConsumer;

  constructor(
    private readonly rabbitmqUrl: string,
    private readonly triggerProcessorService: TriggerProcessorService
  ) {}

  async start(): Promise<void> {
      this.connection = new RabbitMQConnection(this.rabbitmqUrl);
      await this.connection.connect();
      this.consumer = await RabbitMQConsumer.create(this.connection, 'dispatcher-queue');
      await this.consumer.consume(async (message) => {
        await this.triggerProcessorService.processTrigger(message.payload);
      });
  }

  async stop(): Promise<void> {
    await this.consumer.close();
    await this.connection.close();
  }
}