import './instrumentation';

import { App } from './app';
import { loadConfig } from './envConfig';
import { createLogger } from '@anticapture/observability';

const logger = createLogger('dispatcher');

const config = loadConfig();
const app = new App(
  config.subscriptionServerUrl,
  config.rabbitmqUrl,
  config.anticaptureGraphqlEndpoint,
  config.port,
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
