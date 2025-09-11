import { RabbitMQTestSetup } from '../rabbitmq-setup';

/**
 * @notice Jest global teardown function executed once after all tests
 * @dev Stops RabbitMQ container and cleans up global test environment
 * @return Promise that resolves when teardown is complete
 */
export default async function globalTeardown() {
  if ((global as any).__RABBITMQ_CONTAINER__) {
    await (global as any).__RABBITMQ_CONTAINER__.stop();
  }
  await RabbitMQTestSetup.getInstance().cleanup();
  delete (process as any).env.TEST_RABBITMQ_URL;
}