import { beforeAll, afterAll } from '@jest/globals';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../mocks';
import { mockTelegramSendMessage } from '../../mocks/telegram-mock-setup';
import { mockSlackSendMessage } from '../../mocks/slack-mock-setup';
import { setupDatabase, db, closeDatabase, startTestApps, stopTestApps, TestApps } from '../../setup';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import * as fs from 'fs';
import { timeouts } from '../../config';

// Global state accessible in tests
declare global {
  var testApps: TestApps;
  var httpMockSetup: HttpClientMockSetup;
  var mockTelegramSendMessage: any;
  var mockSlackSendMessage: any;
}

/**
 * @notice Jest setup after environment function executed once before test suites
 * @dev Initializes database, mocking systems, and starts test applications
 */
beforeAll(async () => {
  const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
  files.forEach(file => {
    fs.unlinkSync(`/tmp/${file}`);
  });
  await setupDatabase();
  const { WorkspaceFactory } = await import('../../fixtures/factories/workspace-factory');
  await WorkspaceFactory.createDefaultSlackWorkspace();
  const httpMockSetup = new HttpClientMockSetup();
  GraphQLMockSetup.setupMock(httpMockSetup.getMockClient());
  const rabbitmqUrl = process.env.TEST_RABBITMQ_URL;
  if (!rabbitmqUrl) {
    throw new Error('TEST_RABBITMQ_URL not set. Make sure globalSetup ran correctly.');
  }
  const apps = await startTestApps(db, httpMockSetup.getMockClient());
  const rabbitmqSetup = RabbitMQTestSetup.getInstance();
  await rabbitmqSetup.setup(rabbitmqUrl); // Pass existing URL to avoid creating new container
  apps.rabbitmqSetup = rabbitmqSetup;
  
  // Get the mocks from the test clients that were injected into the app
  global.mockTelegramSendMessage = apps.mockTelegramSendMessage || mockTelegramSendMessage;
  global.mockSlackSendMessage = apps.mockSlackSendMessage || mockSlackSendMessage;

  global.testApps = apps;
  global.httpMockSetup = httpMockSetup;
  
}, timeouts.test.short);

afterAll(async () => {
  if (global.testApps) {
    await stopTestApps(global.testApps);
  }
  closeDatabase();
});