import { App } from './app';
import { setupDatabaseConnection, config } from './config';

const db = setupDatabaseConnection('pg', config.databaseUrl);

(async () => {
  const app = App.create({
    db,
    port: config.port
  });

  await app.start();
})();