import { describe, test, expect, beforeEach, beforeAll } from 'vitest';
import { proposalsHandler } from '@anticapture/client/msw';
import { type OnchainProposal } from '@notification-system/anticapture-client';
import { db, TestApps } from '../../src/setup';
import { server, proposalsByDaoResolver } from '../../src/setup/msw-server';
import { UserFactory, ProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

const useProposals = (proposals: OnchainProposal[]) =>
  server.use(proposalsHandler(proposalsByDaoResolver(proposals)));

describe('Temporal Filtering - Integration Test', () => {
  let apps: TestApps;

  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();

    telegramHelper = new TelegramTestHelper(global.telegramClient);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should NOT notify users about proposals created BEFORE their subscription', async () => {
    // Create DAO for this test
    const testDaoId = testConstants.daoIds.temporalTest1;
    
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    // Create proposal BEFORE user subscription (older timestamp)
    const oldProposal = ProposalFactory.createProposal(testDaoId, 'old-proposal', {
      status: 'ACTIVE',
      timestamp: Math.floor(baseTime.getTime() / 1000),
      endTimestamp: Math.floor(baseTime.getTime() / 1000 + 3600)
    });
    
    // User subscribes AFTER proposal creation
    const subscriptionTime = new Date('2024-01-01T11:00:00Z'); // 11:00 AM
    await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p6.chatId, 
      'temporal_user', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    useProposals([oldProposal]);
    
    // Ensure no messages are sent for old proposals
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Also verify no notification was recorded in database
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.profiles.p6.chatId }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'old-proposal');
  });

  test('should notify users about proposals created AFTER their subscription', async () => {
    // Create DAO for this test
    const testDaoId = testConstants.daoIds.temporalTest2;
    
    // User subscribes FIRST
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p7.chatId, 
      'temporal_user_2', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // Create proposal AFTER user subscription (newer timestamp)
    const newProposal = ProposalFactory.createProposal(testDaoId, 'new-proposal', {
      status: 'ACTIVE'
    });

    useProposals([newProposal]);
    
    // Wait for the notification to be sent
    const message = await telegramHelper.waitForUserMessage(testConstants.profiles.p7.chatId, {
      timeout: timeouts.notification.delivery
    });
    
    // Verify the message contains proposal information
    expect(message.text).toContain(`Test ${testConstants.daoIds.temporalTest2} proposal`);
    
    // Verify notification was recorded in database
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.profiles.p7.chatId }).first();
    await dbHelper.waitForNotificationRecord(user.id, 'new-proposal');
  });

  test('should NOT notify about proposals created during unsubscribed period after resubscribing', async () => {
    const testDaoId = testConstants.daoIds.temporalTest3;
    
    // User subscribes initially
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    let testUser = await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p8.chatId, 
      'temporal_user_3', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // User unsubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, false, new Date('2024-01-01T12:00:00Z').toISOString());
    
    // Proposal created during inactive period (user should NOT be notified about this)
    const inactiveProposal = ProposalFactory.createProposal(testDaoId, 'during-inactive-proposal', {
      status: 'ACTIVE',
      timestamp: Math.floor(new Date('2024-01-01T13:00:00Z').getTime() / 1000),
      endTimestamp: Math.floor(new Date('2024-01-01T14:00:00Z').getTime() / 1000)
    });

    // User resubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, true, new Date('2024-01-01T14:00:00Z').toISOString());
    

    useProposals([inactiveProposal]);
    
    // Ensure no notification is sent for proposals created during inactive period
    await telegramHelper.waitForNoMessages(timeouts.notification.delivery, { fromUser: testConstants.profiles.p8.chatId });
    
    // Verify no notification was recorded
    const user = await db(testConstants.tables.users).where({ channel_user_id: testConstants.profiles.p8.chatId }).first();
    await dbHelper.ensureNoNotificationFor(user.id, 'during-inactive-proposal', timeouts.notification.processing);
  });
});