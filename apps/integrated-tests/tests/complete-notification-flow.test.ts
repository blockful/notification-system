import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { db, closeDatabase } from '../src/config/database';
import { setupMocks } from '../src/config/mocks';
import { setupDatabase, createTestData } from '../src/setup/database';

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
  let testProposal: any;

  beforeAll(async () => {
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }

    await setupDatabase();
    const testData = await createTestData();
    testProposal = testData.testProposal;
    
    logicDb = setupDatabaseConnection('sqlite3', '/tmp/test_integration.db');
    
    subscriptionServerApp = new SubscriptionServerApp(db, 14001);
    await subscriptionServerApp.start();
    
    dispatcherApp = new DispatcherApp(
      13002,                                    // port
      'http://localhost:14001',                 // subscriptionServerUrl
      'http://localhost:14002'                  // telegramConsumerUrl
      // environment defaults to 'development'
    );
    await dispatcherApp.start();
    
    consumerApp = new ConsumerApp(
      db,                                       // daosDb
      db,                                       // usersDb
      '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY', // telegramBotToken
      'http://localhost:14001',                 // subscriptionServerUrl
      14002                                     // port
    );
    await consumerApp.start();
    
    logicSystemApp = new LogicSystemApp(
      logicDb,                                  // db
      'http://127.0.0.1:13002/messages',       // dispatcherEndpoint
      5000,                                     // triggerInterval
      'active'                                  // proposalStatus
    );
    logicSystemApp.start();
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { testProposal };
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
  });

  test('should complete full notification flow: proposal added -> logic-system -> dispatcher -> subscription-api -> consumer -> telegraf', async () => {
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