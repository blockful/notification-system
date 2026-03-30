import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainVoteFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Offchain Vote Cast Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send notification when user votes on Snapshot proposal', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-offchain-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;

    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-vote-user',
      testDaoId,
      true,
      pastTimestamp
    );

    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;
    const proposalTitle = 'Snapshot: Enable Community Grants';

    const offchainVoteEvents = [
      OffchainVoteFactory.createVote(voterAddress, 'snap-prop-123', testDaoId, {
        created: eventTimestamp,
        proposalTitle,
        reason: 'Fully support this initiative!',
        vp: 2500.75
      })
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      [],
      [],
      offchainVoteEvents
    );

    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('voted on Snapshot proposal'),
      { timeout: timeouts.notification.delivery }
    );

    expect(message.chatId).toBe(testUser.chatId);
    expect(message.text).toContain('🗳️');
    expect(message.text).toContain(proposalTitle);
    expect(message.text).toContain('Reason: "Fully support this initiative!"');
  });

  test('should NOT send duplicate notifications for same offchain vote', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-offchain-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;

    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-vote-dedup',
      testDaoId,
      true,
      pastTimestamp
    );

    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const offchainVoteEvents = [
      OffchainVoteFactory.createVote(voterAddress, 'snap-dedup-1', testDaoId, {
        created: eventTimestamp,
        proposalTitle: 'Dedup Test Proposal',
        vp: 1000
      })
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      [],
      [],
      offchainVoteEvents
    );

    // Wait for first notification
    const firstMessage = await telegramHelper.waitForMessage(
      msg => msg.text.includes('voted on Snapshot proposal'),
      { timeout: timeouts.notification.delivery }
    );
    expect(firstMessage.chatId).toBe(testUser.chatId);
    expect(firstMessage.text).toContain('Dedup Test Proposal');

    // Reset triggers to force re-processing
    apps.logicSystemApp.resetTriggers();

    // Wait and verify no second notification is sent
    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('voted on Snapshot proposal'),
      { timeout: timeouts.wait.short }
    );

    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });

  test('should NOT notify users not subscribed to DAO', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-offchain-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;

    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    // Create user subscribed to a DIFFERENT DAO
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-vote-nosub',
      'different-dao',
      true,
      pastTimestamp
    );

    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const offchainVoteEvents = [
      OffchainVoteFactory.createVote(voterAddress, 'snap-nosub-1', testDaoId, {
        created: eventTimestamp,
        proposalTitle: 'Unsubscribed DAO Proposal',
        vp: 500
      })
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      [],
      [],
      offchainVoteEvents
    );

    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('voted on Snapshot proposal'),
      { timeout: timeouts.wait.short }
    );

    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });
});
