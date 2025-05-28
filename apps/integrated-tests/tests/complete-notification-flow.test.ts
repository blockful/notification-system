import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { setupTestEnvironment } from '@integrated-tests/config/env';
import { db, closeDatabase } from '@integrated-tests/config/database';
import { setupMocks } from '@integrated-tests/config/mocks';
import { setupDatabase, createTestData } from '@integrated-tests/setup/database';

setupTestEnvironment();
const mockSendMessage = setupMocks();

import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp, setupDatabaseConnection } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';

describe('Complete Notification Flow - Full Integration Test', () => {
  let consumerApp: ConsumerApp;
  let logicSystemApp: LogicSystemApp;
  let dispatcherApp: DispatcherApp;
  let subscriptionServerApp: SubscriptionServerApp;
  let logicDb: any;

  beforeAll(async () => {
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (logicSystemApp) {
      await logicSystemApp.stop();
    }
    if (consumerApp) {
      await consumerApp.stop();
    }
    if (dispatcherApp) {
      await dispatcherApp.stop();
    }
    if (subscriptionServerApp) {
      await subscriptionServerApp.stop();
    }
    if (logicDb) {
      await logicDb.destroy();
    }
    
    closeDatabase();
    
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }
  });

  test('should complete full notification flow: proposal added -> logic-system -> dispatcher -> subscription-api -> consumer -> telegraf', async () => {
    await setupDatabase();
    const { testProposal } = await createTestData();
    
    logicDb = setupDatabaseConnection('sqlite3', '/tmp/test_integration.db');
    
    subscriptionServerApp = new SubscriptionServerApp(db, parseInt(process.env.SUBSCRIPTION_PORT!));
    await subscriptionServerApp.start();
    
    dispatcherApp = new DispatcherApp(
      parseInt(process.env.PORT!),
      process.env.SUBSCRIPTION_SERVER_URL!,
      process.env.TELEGRAM_CONSUMER_URL!
    );
    await dispatcherApp.start();
    
    consumerApp = new ConsumerApp(
      db,
      db,
      process.env.TELEGRAM_BOT_TOKEN!,
      process.env.SUBSCRIPTION_SERVER_URL!
    );
    await consumerApp.start();
    
    logicSystemApp = new LogicSystemApp(
      logicDb,
      process.env.DISPATCHER_ENDPOINT!,
      parseInt(process.env.TRIGGER_INTERVAL!),
      'active'
    );
    logicSystemApp.start();
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const initialProposals = await db('proposals_onchain').select('*');
    expect(initialProposals.length).toBe(1);
    expect(initialProposals[0].status).toBe('pending');
    
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    await db('proposals_onchain')
      .where({ id: testProposal.id })
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      });
    
    const updatedProposal = await db('proposals_onchain')
      .where({ id: testProposal.id })
      .first();
    expect(updatedProposal.status).toBe('active');
    
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    expect(newCallsCount).toBeGreaterThan(0);
    expect(mockSendMessage).toHaveBeenCalled();
  });
}); 