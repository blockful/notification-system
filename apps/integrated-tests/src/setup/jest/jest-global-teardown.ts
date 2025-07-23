import { globalRabbitMQSetup } from './rabbitmq-setup';

export default async function globalTeardown() {
  if ((global as any).__RABBITMQ_CONTAINER__) {
    await (global as any).__RABBITMQ_CONTAINER__.stop();
  }
  await globalRabbitMQSetup.globalCleanup();
  delete (process as any).env.TEST_RABBITMQ_URL;
}