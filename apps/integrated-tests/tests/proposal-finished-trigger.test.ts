import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  // Helper function
  const createFinishedProposal = (daoId: string, proposalId: string, baseTime?: Date) => {
    // Use baseTime or create a proposal that finished 10 seconds ago
    const base = baseTime || new Date();
    const proposalCreationTime = new Date(base.getTime() + testConstants.proposalTiming.creationOffset);
    
    // For a 12-second block time:
    // Proposal created at block 1000, voting starts immediately (no delay)
    // Needs to run for 50 seconds to finish 10 seconds ago
    const startBlock = testConstants.proposalTiming.defaultStartBlock;
    const blocksToRun = Math.floor(testConstants.proposalTiming.proposalRunDuration / testConstants.defaults.blockTime);
    const endBlock = startBlock + blocksToRun;
    
    return ProposalFactory.createProposal(daoId, proposalId, {
      timestamp: Math.floor(proposalCreationTime.getTime() / 1000).toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      status: 'active',
      description: `# Finished Proposal\n\nThis proposal has ended.`
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });


  test('should send notification when proposal finishes', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;
    const testUser = testConstants.profiles.p9;
    
    // Create user with subscription before proposal
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset);
    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      testUser.chatId,
      testDaoId,
      true,
      subscriptionTime.toISOString()
    );
    
    // Create a proposal that has already finished
    const proposal = createFinishedProposal(testDaoId, 'finishing-proposal-1');
    
    // Setup mock to return the finished proposal
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], []);

    // Wait for the notification to be sent
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Finished Proposal') && 
             msg.text.includes('has ended') &&
             msg.text.includes(testDaoId),
      { timeout: timeouts.notification.delivery }
    );

    // Verify message content
    expect(message.chatId).toBe(testUser.chatId);
    expect(message.text).toContain('Finished Proposal');
    
    // Verify database record
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 1);
  });

  test('should NOT send notification for proposals that have not finished yet', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;
    const testUser = testConstants.profiles.p8;
    
    // Create user with subscription
    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      testUser.chatId,
      testDaoId,
      true
    );
    
    // Create a proposal that will finish in the future
    const now = Math.floor(Date.now() / 1000);
    const futureProposal = ProposalFactory.createProposal(testDaoId, 'future-proposal-1', {
      timestamp: (now - 10).toString(), // Created 10 seconds ago
      startBlock: testConstants.proposalTiming.defaultStartBlock,
      endBlock: testConstants.proposalTiming.defaultStartBlock + testConstants.proposalTiming.futureProposalBlocks, // Will finish in ~1080 seconds
      status: 'active',
      description: '# Future Proposal\n\nThis proposal will not finish during the test.'
    });

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [futureProposal], []);

    // Ensure no messages are sent
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Verify no notifications in database
    const notificationCount = await db(testConstants.tables.notifications).count('* as count');
    expect(notificationCount[0].count).toBe(0);
  });

  test('should process multiple finished proposals', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;
    const testUser = testConstants.profiles.p4;
    
    // Create user with subscription
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset);
    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      testUser.chatId,
      testDaoId,
      true,
      subscriptionTime.toISOString()
    );
    
    // Create multiple finished proposals
    const proposals = [
      createFinishedProposal(testDaoId, 'finished-1'),
      createFinishedProposal(testDaoId, 'finished-2'),
      createFinishedProposal(testDaoId, 'finished-3')
    ];

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, []);

    // Wait for all 3 messages
    await telegramHelper.waitForMessageCount(3, { 
      timeout: timeouts.notification.delivery,
      fromUser: testUser.chatId 
    });
    
    // Verify messages content
    const allMessages = telegramHelper.getAllMessages();
    const userMessages = allMessages.filter(msg => msg.chatId === testUser.chatId);
    
    expect(userMessages).toHaveLength(3);
    expect(userMessages[0].text).toContain('Finished Proposal');
    expect(userMessages[1].text).toContain('Finished Proposal');
    expect(userMessages[2].text).toContain('Finished Proposal');
    
    // Verify all messages are about finished proposals
    expect(userMessages.every(msg => msg.text.includes('Finished Proposal'))).toBe(true);
    expect(userMessages.every(msg => msg.text.includes('has ended'))).toBe(true);
    
    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });

  test('should NOT notify about proposals that finished before user subscription', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;
    const testUser = testConstants.profiles.p2;
    
    // Define clear timeline
    const baseTime = new Date(testConstants.testDates.baseTime);
    const proposalCreatedAt = new Date(testConstants.testDates.proposalCreatedAt); // 2 hours before
    const userSubscribedAt = baseTime; // Now
    
    // Create user with subscription at specific time
    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      testUser.chatId,
      testDaoId,
      true,
      userSubscribedAt.toISOString()
    );
    
    // Create proposal that was created and finished before user subscription
    const oldProposal = ProposalFactory.createProposal(testDaoId, 'old-finished-proposal', {
      timestamp: Math.floor(proposalCreatedAt.getTime() / 1000).toString(),
      startBlock: testConstants.proposalTiming.defaultStartBlock,
      endBlock: testConstants.proposalTiming.defaultStartBlock + 1, // Finished quickly (1 block = 12 seconds)
      status: 'executed',
      description: '# Old Proposal\n\nThis finished before user subscribed.'
    });

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [oldProposal], []);

    // Ensure no messages are sent
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Verify no notifications in database
    const notificationCount = await db(testConstants.tables.notifications).count('* as count');
    expect(notificationCount[0].count).toBe(0);
  });

  test('should handle proposals from multiple DAOs', async () => {
    const dao1Id = testConstants.daoIds.temporalTest1;
    const dao2Id = testConstants.daoIds.temporalTest2;
    const testUser = testConstants.profiles.p5;
    
    // Create user with subscriptions to both DAOs
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset);
    const userSetup = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      testUser.chatId,
      dao1Id,
      true,
      subscriptionTime.toISOString()
    );
    
    // Add second DAO subscription
    await UserFactory.createUserPreference(
      userSetup.user.id, 
      dao2Id, 
      true, 
      subscriptionTime.toISOString()
    );
    
    // Create finished proposals for each DAO
    const dao1Proposal = createFinishedProposal(dao1Id, 'dao1-finished');
    const dao2Proposal = createFinishedProposal(dao2Id, 'dao2-finished');

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [dao1Proposal, dao2Proposal], []);

    // Wait for 2 messages (one for each DAO)
    await telegramHelper.waitForMessageCount(2, { 
      timeout: timeouts.notification.delivery,
      fromUser: testUser.chatId
    });
    
    // Verify messages content
    const allMessages = telegramHelper.getAllMessages();
    const userMessages = allMessages.filter(msg => msg.chatId === testUser.chatId);
    
    expect(userMessages).toHaveLength(2);
    
    // Verify each DAO's proposal is mentioned
    const dao1Message = userMessages.find(msg => msg.text.includes(dao1Id));
    const dao2Message = userMessages.find(msg => msg.text.includes(dao2Id));
    
    expect(dao1Message).toBeDefined();
    expect(dao1Message?.text).toContain('Finished Proposal');
    expect(dao1Message?.text).toContain('has ended');
    
    expect(dao2Message).toBeDefined();
    expect(dao2Message?.text).toContain('Finished Proposal');
    expect(dao2Message?.text).toContain('has ended');
    
    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 2);
  });
});