import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Temporal Filtering - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

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
      testConstants.testUsers.user6, 
      'temporal_user', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [oldProposal]);
    
    // Ensure no messages are sent for old proposals
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Also verify no notification was recorded in database
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.testUsers.user6 }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'old-proposal');
  });

  test('should notify users about proposals created AFTER their subscription', async () => {
    // Create DAO for this test
    const testDaoId = 'TEMPORAL_DAO_2';
    
    // User subscribes FIRST
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    await UserFactory.createUserWithFullSetup(
      testConstants.testUsers.user7, 
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
    const message = await telegramHelper.waitForUserMessage(testConstants.testUsers.user7, {
      timeout: timeouts.notification.delivery
    });
    
    // Verify the message contains proposal information
    expect(message.text).toContain('Test TEMPORAL_DAO_2 proposal');
    
    // Verify notification was recorded in database
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.testUsers.user7 }).first();
    await dbHelper.waitForNotificationRecord(user.id, 'new-proposal');
  });

  test('should NOT notify about proposals created during unsubscribed period after resubscribing', async () => {
    const testDaoId = 'TEMPORAL_DAO_3';
    
    // User subscribes initially
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    let testUser = await UserFactory.createUserWithFullSetup(
      testConstants.testUsers.user8, 
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
    await telegramHelper.waitForNoMessages(timeouts.notification.delivery, { fromUser: testConstants.testUsers.user8 });
    
    // Verify no notification was recorded
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.testUsers.user8 }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'during-inactive-proposal', timeouts.notification.processing);
  });
});