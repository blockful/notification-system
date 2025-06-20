import { App } from './app';
import { loadConfig } from './envConfig';

const config = loadConfig();
const app = new App(config.subscriptionServerUrl, config.telegramConsumerUrl, config.rabbitmqUrl);

(async () => {
  await app.start();
})();