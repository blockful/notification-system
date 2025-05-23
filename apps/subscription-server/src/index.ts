#!/usr/bin/env node

import { App } from './app';
import { setupDatabaseConnection, config } from './config';

const db = setupDatabaseConnection('pg', config.databaseUrl);

const app = new App(db, config.port);

(async () => {
  await app.start();
})();