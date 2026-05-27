import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';

let container: StartedRabbitMQContainer | undefined;

export async function setup() {
  const started = await new RabbitMQContainer().withStartupTimeout(150_000).start();

  let amqpUrl = started.getAmqpUrl();
  const urlObj = new URL(amqpUrl);
  if (!urlObj.username && !urlObj.password) {
    urlObj.username = 'guest';
    urlObj.password = 'guest';
  }
  amqpUrl = urlObj.toString();

  process.env.TEST_RABBITMQ_URL = amqpUrl;
  container = started;
}

export async function teardown() {
  if (container) {
    await container.stop();
    container = undefined;
  }
  delete process.env.TEST_RABBITMQ_URL;
}
