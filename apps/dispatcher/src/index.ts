import { App } from './app';
import { loadConfig } from './envConfig';

const config = loadConfig();
const app = new App(
  config.subscriptionServerUrl, 
  config.rabbitmqUrl, 
  config.anticaptureGraphqlEndpoint
);

(async () => {
  await app.start();
})();