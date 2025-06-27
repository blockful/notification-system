import axios from 'axios';
import { App } from './app';
import { env } from './config/env';

(async () => {
  const app = await App.create({
    triggerInterval: env.TRIGGER_INTERVAL,
    proposalStatus: env.PROPOSAL_STATUS,
    anticaptureHttpClient: axios.create({ baseURL: env.ANTICAPTURE_GRAPHQL_ENDPOINT }),
    rabbitmqUrl: env.RABBITMQ_URL
  });

  await app.start();
})();

//@ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};