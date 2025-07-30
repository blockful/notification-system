import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';

// Global state to share RabbitMQ URL
declare global {
  var __RABBITMQ_URL__: string;
  var __RABBITMQ_CONTAINER__: StartedRabbitMQContainer;
}

/**
 * @notice Jest global setup function executed once before all tests
 * @dev Starts RabbitMQ container and sets up global test environment
 * @return Promise that resolves when setup is complete
 */
export default async function globalSetup() {
  const container = await new RabbitMQContainer()
    .withStartupTimeout(150000)
    .start();
  
  const amqpUrl = container.getAmqpUrl();
  
  // Store RabbitMQ URL in environment variable for tests to access
  process.env.TEST_RABBITMQ_URL = amqpUrl;
  
  // Store container reference for teardown
  global.__RABBITMQ_CONTAINER__ = container;
  global.__RABBITMQ_URL__ = amqpUrl;
}
