import axios from 'axios';
import { App } from './app';
import { env } from './config/env';

const app = new App(
  env.TRIGGER_INTERVAL,
  env.PROPOSAL_STATUS,
  axios.create({
    baseURL: env.ANTICAPTURE_GRAPHQL_ENDPOINT,
    headers: {
      ...(env.BLOCKFUL_API_TOKEN && {
        Authorization: `Bearer ${env.BLOCKFUL_API_TOKEN}`,
      }),
    },
  }),
  env.RABBITMQ_URL,
);

app.start();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};