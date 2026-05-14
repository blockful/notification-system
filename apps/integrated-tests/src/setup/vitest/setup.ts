import { beforeAll, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import { server } from '../msw-server';
import { setupDatabase, db, closeDatabase, startTestApps, stopTestApps, TestApps } from '..';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import { timeouts } from '../../config';
import type { SimpleTelegramClient } from '../../test-clients/simple-telegram.client';
import type { SimpleSlackClient } from '../../test-clients/simple-slack.client';

declare global {
  // eslint-disable-next-line no-var
  var testApps: TestApps;
  // eslint-disable-next-line no-var
  var telegramClient: SimpleTelegramClient;
  // eslint-disable-next-line no-var
  var slackClient: SimpleSlackClient;
}

beforeAll(async () => {
  // server.listen MUST run before app boot so the in-process apps' fetch
  // calls are intercepted from the very first request.
  server.listen({
    onUnhandledRequest: (request) => {
      const { hostname } = new URL(request.url);
      if (hostname === '127.0.0.1' || hostname === 'localhost') return;
      throw new Error(`[MSW] Unhandled ${request.method} ${request.url}`);
    },
  });

  const tmpFiles = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
  for (const file of tmpFiles) {
    fs.unlinkSync(`/tmp/${file}`);
  }
  await setupDatabase();

  const { WorkspaceFactory } = await import('../../fixtures/factories/workspace-factory');
  await WorkspaceFactory.createDefaultSlackWorkspace();

  const rabbitmqUrl = process.env.TEST_RABBITMQ_URL;
  if (!rabbitmqUrl) {
    throw new Error('TEST_RABBITMQ_URL not set. globalSetup did not run.');
  }

  const apps = await startTestApps(db);
  const rabbitmqSetup = RabbitMQTestSetup.getInstance();
  await rabbitmqSetup.setup(rabbitmqUrl);
  apps.rabbitmqSetup = rabbitmqSetup;

  global.telegramClient = apps.telegramClient;
  global.slackClient = apps.slackClient;
  global.testApps = apps;
}, timeouts.test.short);

beforeEach(() => {
  server.resetHandlers();
});

afterAll(async () => {
  if (global.testApps) {
    await stopTestApps(global.testApps);
  }
  closeDatabase();
  server.close();
});
