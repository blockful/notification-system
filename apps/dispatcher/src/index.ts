import './instrumentation';

import { App } from './app';
import { loadConfig } from './envConfig';
import { logger } from './logger';

const config = loadConfig();
const app = new App(
  config.subscriptionServerUrl,
  config.rabbitmqUrl,
  config.anticaptureGraphqlEndpoint,
  undefined,
  config.blockfulApiToken
);

(async () => {
  try {
    await app.start();
  } catch (err) {
    logger.error({ err }, 'dispatcher failed to start');
    process.exit(1);
  }
})();
