import { EventCollector } from '../../helpers/messaging/event-collector';

/**
 * @notice Configuration interface for RabbitMQ test setup
 * @dev Defines the structure for configuring RabbitMQ connections and event handling
 */
export interface RabbitMQSetupConfig {
  /** AMQP connection URL for RabbitMQ */
  amqpUrl: string;
  /** Event collector instance for gathering test events */
  eventCollector: EventCollector;
  /** Cleanup function to reset RabbitMQ state */
  cleanup: () => Promise<void>;
  /** Reset function to clear collected events */
  reset: () => void;
}

/**
 * @notice Configuration interface for RabbitMQ queue manager
 * @dev Defines queue creation and management parameters
 */
export interface QueueManagerConfig {
  /** Name of the queue to create or manage */
  queueName: string;
  /** Whether the queue should survive server restarts */
  durable?: boolean;
}

/**
 * @notice Configuration interface for RabbitMQ spy consumer
 * @dev Defines how spy consumers should monitor and collect message events
 */
export interface SpyConsumerConfig {
  /** Name of the queue to monitor */
  queueName: string;
  /** Event collector instance to store intercepted messages */
  eventCollector: EventCollector;
}

/**
 * @notice Interface for RabbitMQ connection abstraction
 * @dev Defines the contract for RabbitMQ connection operations
 */
export interface RabbitMQConnection {
  /** Creates a new channel on the connection */
  createChannel(): Promise<any>;
  /** Establishes connection to RabbitMQ server */
  connect(): Promise<void>;
  /** Closes the connection to RabbitMQ server */
  close(): Promise<void>;
}

/**
 * @notice Interface for RabbitMQ container management
 * @dev Defines the contract for managing RabbitMQ Docker containers
 */
export interface ContainerManager {
  /** Gets or starts a RabbitMQ container and returns connection info */
  getContainer(): Promise<{ getAmqpUrl(): string }>;
  /** Stops and cleans up the RabbitMQ container */
  cleanup(): Promise<void>;
}

/**
 * @notice Interface for RabbitMQ connection management
 * @dev Defines the contract for managing RabbitMQ connections
 */
export interface ConnectionManager {
  /** Gets or creates a RabbitMQ connection */
  getConnection(): Promise<RabbitMQConnection>;
  /** Closes connection and cleans up resources */
  cleanup(): Promise<void>;
}

/**
 * @notice Interface for RabbitMQ queue management
 * @dev Defines the contract for queue operations and setup
 */
export interface QueueManager {
  /** Clears all messages from the specified queue */
  clearQueue(queueName: string): Promise<void>;
  /** Sets up multiple queues based on provided configurations */
  setupQueues(queues: QueueManagerConfig[]): Promise<void>;
}

/**
 * @notice Interface for RabbitMQ spy consumer management
 * @dev Defines the contract for monitoring message flow during tests
 */
export interface SpyConsumerManager {
  /** Sets up a spy consumer to monitor queue messages */
  setupSpyConsumer(config: SpyConsumerConfig): Promise<void>;
  /** Closes all spy consumers and cleans up resources */
  cleanup(): Promise<void>;
} 