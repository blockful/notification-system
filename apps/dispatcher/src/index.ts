import { App } from './app';
import { loadConfig } from './envConfig';

const config = loadConfig();
const app = new App(config.port, config.subscriptionServerUrl, config.telegramConsumerUrl, config.environment);

(async () => {
  await app.start();
})();