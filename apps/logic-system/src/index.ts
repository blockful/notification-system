import { App } from './app';
import { setupDatabaseConnection } from './config/database';
import { env } from './config/env';

const db = setupDatabaseConnection('pg', env.DATABASE_URL, env.IS_PRODUCTION);

const app = new App(
  db,
  env.DISPATCHER_ENDPOINT,
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
);

app.start();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};