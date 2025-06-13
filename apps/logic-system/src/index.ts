import axios from 'axios';
import { App } from './app';
import { env } from './config/env';

const app = new App(
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
  axios.create({ baseURL: env.ANTICAPTURE_GRAPHQL_ENDPOINT }),
  axios.create({ baseURL: env.DISPATCHER_ENDPOINT })
);

app.start();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};