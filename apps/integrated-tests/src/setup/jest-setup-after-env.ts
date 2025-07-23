import { beforeAll, afterAll } from '@jest/globals';
import { mockSendMessage } from '../mocks/telegram-mock-setup';
import { setupDatabase } from './database-migrations';
import { startTestApps, stopTestApps, TestApps } from './apps';
import { db, closeDatabase } from './database-config';
import { HttpClientMockSetup } from '../mocks/http-client-mock';
import { GraphQLMockSetup } from '../mocks/graphql-mock-setup';
import { RabbitMQTestSetup } from './rabbitmq-setup';
import * as fs from 'fs';

// Global state accessible in tests
declare global {
  var testApps: TestApps;
  var httpMockSetup: HttpClientMockSetup;
  var mockSendMessage: any;
}

// This runs once before all test suites
beforeAll(async () => {
  const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
  files.forEach(file => {
    fs.unlinkSync(`/tmp/${file}`);
  });
  await setupDatabase();
  const httpMockSetup = new HttpClientMockSetup();
  GraphQLMockSetup.setupEmptyMock(httpMockSetup.getMockClient());
  const rabbitmqUrl = process.env.TEST_RABBITMQ_URL;
  if (!rabbitmqUrl) {
    throw new Error('TEST_RABBITMQ_URL not set. Make sure globalSetup ran correctly.');
  }
  const apps = await startTestApps(db, httpMockSetup.getMockClient());
  const rabbitmqSetup = new RabbitMQTestSetup();
  await rabbitmqSetup.setupWithExistingContainer(rabbitmqUrl);
  apps.rabbitmqSetup = rabbitmqSetup;
  global.testApps = apps;
  global.httpMockSetup = httpMockSetup;
  global.mockSendMessage = mockSendMessage;
  
}, 30000);

afterAll(async () => {
  if (global.testApps) {
    await stopTestApps(global.testApps);
  }
  closeDatabase();
});