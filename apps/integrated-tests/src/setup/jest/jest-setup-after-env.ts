import { beforeAll, afterAll } from '@jest/globals';
import { mockSendMessage, HttpClientMockSetup, GraphQLMockSetup } from '../../mocks';
import { setupDatabase, db, closeDatabase, startTestApps, stopTestApps, TestApps } from '../../setup';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import * as fs from 'fs';
import { timeouts } from '../../config';

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
  
}, timeouts.test.short);

afterAll(async () => {
  if (global.testApps) {
    await stopTestApps(global.testApps);
  }
  closeDatabase();
});