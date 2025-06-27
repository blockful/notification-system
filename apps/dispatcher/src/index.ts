import { App } from './app';
import { loadConfig } from './envConfig';

(async () => {
  const config = loadConfig();
  const app = await App.create({
    subscriptionServerUrl: config.subscriptionServerUrl,
    rabbitmqUrl: config.rabbitmqUrl
  });

  await app.start();
})();