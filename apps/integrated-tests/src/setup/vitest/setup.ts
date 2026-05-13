import { beforeAll, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import { server } from '../msw-server';
import { mockTelegramSendMessage } from '../../mocks/telegram-mock-setup';
import { mockSlackSendMessage } from '../../mocks/slack-mock-setup';
import { setupDatabase, db, closeDatabase, startTestApps, stopTestApps, TestApps } from '..';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import { timeouts } from '../../config';

declare global {
  // eslint-disable-next-line no-var
  var testApps: TestApps;
  // eslint-disable-next-line no-var
  var mockTelegramSendMessage: any;
  // eslint-disable-next-line no-var
  var mockSlackSendMessage: any;
}

beforeAll(async () => {
  // server.listen MUST run before app boot so the in-process apps' fetch
  // calls are intercepted from the very first request.
  // TODO(spec-2026-05-07): tighten back to 'error' after Phase 1 migration completes
  server.listen({ onUnhandledRequest: 'warn' });

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

  global.mockTelegramSendMessage = apps.mockTelegramSendMessage || mockTelegramSendMessage;
  global.mockSlackSendMessage = apps.mockSlackSendMessage || mockSlackSendMessage;
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
