#!/usr/bin/env node

import { App } from './app';
import { config } from './envConfig';

const app = new App(config.port, config.subscriptionServerUrl, config.telegramConsumerUrl);

(async () => {
  await app.start();
})();