import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { setupTelegramMock } from '../src/mocks/telegram-mock-setup';
const mockSendMessage = setupTelegramMock();
import { db, closeDatabase } from '../src/setup/database-config';
import { setupDatabase } from '../src/setup/database';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { UserFactory } from '../src/test-data/user-factory';
import { ProposalFactory } from '../src/test-data/proposal-factory';
import { TelegramTestHelper } from '../src/helpers/telegram-test-helper';
import { DatabaseTestHelper } from '../src/helpers/database-test-helper';

describe('Temporal Filtering - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    // Clean up any existing test databases
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
    files.forEach(file => {
      fs.unlinkSync(`/tmp/${file}`);
    });

    await setupDatabase();
    
    // Setup mocks
    httpMockSetup = new HttpClientMockSetup();

    // Start all applications
    apps = await startTestApps(db, httpMockSetup.getMockClient());
    
    // Initialize test helpers
    telegramHelper = new TelegramTestHelper(mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    httpMockSetup.reset();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
  }, 40000);

  test('should NOT notify users about proposals created BEFORE their subscription', async () => {
    // Create DAO for this test
    const testDaoId = 'TEMPORAL_DAO_1';
    
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    // Create proposal BEFORE user subscription (older timestamp)
    const oldProposal = ProposalFactory.createProposal(testDaoId, 'old-proposal', {
      status: 'pending',
      timestamp: baseTime.toISOString() // 10:00 AM
    });
    
    // User subscribes AFTER proposal creation
    const subscriptionTime = new Date('2024-01-01T11:00:00Z'); // 11:00 AM
    await UserFactory.createUserWithFullSetup(
      '777777777', 
      'temporal_user', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [oldProposal]);
    
    // Ensure no messages are sent for old proposals
    await telegramHelper.waitForNoMessages(2000);
    
    // Also verify no notification was recorded in database
    const user = await db('users').where({ channel_user_id: '777777777' }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'old-proposal');
  });

  test('should notify users about proposals created AFTER their subscription', async () => {
    // Create DAO for this test
    const testDaoId = 'TEMPORAL_DAO_2';
    
    // User subscribes FIRST
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    await UserFactory.createUserWithFullSetup(
      '888888888', 
      'temporal_user_2', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // Create proposal AFTER user subscription (newer timestamp)
    const newProposal = ProposalFactory.createProposal(testDaoId, 'new-proposal', {
      status: 'pending'
    });

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [newProposal]);
    
    // Wait for the notification to be sent
    const message = await telegramHelper.waitForUserMessage('888888888', {
      timeout: 3000
    });
    
    // Verify the message contains proposal information
    expect(message.text).toContain('Test TEMPORAL_DAO_2 proposal');
    
    // Verify notification was recorded in database
    const user = await db('users').where({ channel_user_id: '888888888' }).first();
    await dbHelper.waitForNotificationRecord(user.id, 'new-proposal');
  });

  test('should NOT notify about proposals created during unsubscribed period after resubscribing', async () => {
    const testDaoId = 'TEMPORAL_DAO_3';
    
    // User subscribes initially
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    let testUser = await UserFactory.createUserWithFullSetup(
      '999999999', 
      'temporal_user_3', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // User unsubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, false, new Date('2024-01-01T12:00:00Z').toISOString());
    
    // Proposal created during inactive period (user should NOT be notified about this)
    const inactiveProposal = ProposalFactory.createProposal(testDaoId, 'during-inactive-proposal', {
      status: 'pending', 
      timestamp: new Date('2024-01-01T13:00:00Z').toISOString() // 1:00 PM
    });

    // User resubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, true, new Date('2024-01-01T14:00:00Z').toISOString());
    

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [inactiveProposal]);
    
    // Ensure no notification is sent for proposals created during inactive period
    await telegramHelper.waitForNoMessages(3000, { fromUser: '999999999' });
    
    // Verify no notification was recorded
    const user = await db('users').where({ channel_user_id: '999999999' }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'during-inactive-proposal', 2000);
  });
});