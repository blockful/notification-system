import './instrumentation';

import { App } from './app';
import { env } from './config/env';
import { createLogger } from '@anticapture/observability';

const logger = createLogger('logic-system');

const app = new App(
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
  env.ANTICAPTURE_API_URL,
  env.RABBITMQ_URL,
  env.PORT,
  undefined,
  env.BLOCKFUL_API_TOKEN ? { Authorization: `Bearer ${env.BLOCKFUL_API_TOKEN}` } : undefined,
);

app.start().catch((err) => {
  logger.error({ err }, 'logic-system failed to start');
  process.exit(1);
});

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};
