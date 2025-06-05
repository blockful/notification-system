import { App } from './app';
import { env } from './config/env';

const app = new App(
  env.ANTICAPTURE_GRAPHQL_ENDPOINT,
  env.DISPATCHER_ENDPOINT,
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
);

app.start();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};