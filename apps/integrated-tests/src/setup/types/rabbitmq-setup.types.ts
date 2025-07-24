import { EventCollector } from '../../helpers/messaging/event-collector';

export interface RabbitMQSetupConfig {
  amqpUrl: string;
  eventCollector: EventCollector;
  cleanup: () => Promise<void>;
  reset: () => void;
}

export interface QueueManagerConfig {
  queueName: string;
  durable?: boolean;
}

export interface SpyConsumerConfig {
  queueName: string;
  eventCollector: EventCollector;
}

export interface RabbitMQConnection {
  createChannel(): Promise<any>;
  connect(): Promise<void>;
  close(): Promise<void>;
}

export interface ContainerManager {
  getContainer(): Promise<{ getAmqpUrl(): string }>;
  cleanup(): Promise<void>;
}

export interface ConnectionManager {
  getConnection(): Promise<RabbitMQConnection>;
  cleanup(): Promise<void>;
}

export interface QueueManager {
  clearQueue(queueName: string): Promise<void>;
  setupQueues(queues: QueueManagerConfig[]): Promise<void>;
}

export interface SpyConsumerManager {
  setupSpyConsumer(config: SpyConsumerConfig): Promise<void>;
  cleanup(): Promise<void>;
} 