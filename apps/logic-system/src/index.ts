import axios from 'axios';
import { App } from './app';
import { env } from './config/env';

const app = new App(
  env.DISPATCHER_ENDPOINT,
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
  axios.create({ baseURL: env.ANTICAPTURE_GRAPHQL_ENDPOINT }),
  axios.create()
);

app.start();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};