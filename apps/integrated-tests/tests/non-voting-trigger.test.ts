import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory, VoteFactory, VoteData } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Non-Voting Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  // Test addresses
  const ADDRESS_ACTIVE = '0x1234567890123456789012345678901234567890';
  const ADDRESS_PARTIAL = '0xabcdef1234567890123456789012345678901234';
  const ADDRESS_INACTIVE = '0x9876543210987654321098765432109876543210';
  const ADDRESS_ZERO_VOTES = '0x1111111111111111111111111111111111111111';

  // Helper to create finished proposals (similar to proposal-finished test)
  const createFinishedProposals = (daoId: string, count: number) => {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => {
      const proposalId = `proposal-${count - i}`;
      // Use same timing as proposal-finished test - proposals that finished 10 seconds ago
      const proposalCreationTime = new Date(now + testConstants.proposalTiming.creationOffset);
      const proposalEndTime = now + (testConstants.proposalTiming.finishOffset * 1000) - (i * 5000); // Stagger by 5 seconds each
      
      const startBlock = testConstants.proposalTiming.defaultStartBlock + (i * 10);
      const blocksToRun = Math.floor(testConstants.proposalTiming.proposalRunDuration / testConstants.defaults.blockTime);
      const endBlock = startBlock + blocksToRun;
      
      return ProposalFactory.createProposal(daoId, proposalId, {
        title: `Proposal ${count - i}`,
        status: 'EXECUTED',
        timestamp: Math.floor(proposalCreationTime.getTime() / 1000).toString(),
        startBlock: startBlock,
        endBlock: endBlock,
        endTimestamp: Math.floor(proposalEndTime / 1000).toString()
      });
    });
  };

  // Helper to format expected non-voting message
  const formatNonVotingMessage = (address: string, daoId: string, proposals: any[]) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const proposalList = proposals
      .slice(0, 3)
      .map(p => `• ${p.title}`)
      .join('\n');
    
    return `⚠️ Non-Voting Alert for DAO ${daoId.toUpperCase()}

The address ${shortAddress} that you follow hasn't voted in the last 3 proposals:

${proposalList}

Consider reaching out to encourage participation!`;
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('Basic non-voting scenario - only completely inactive address gets notification', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;
    
    // Create user following 3 addresses
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p1.chatId,
      'test_user',
      testDaoId,
      [ADDRESS_ACTIVE, ADDRESS_PARTIAL, ADDRESS_INACTIVE],
      true
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);
    
    // Create votes: ADDRESS_ACTIVE voted on all, ADDRESS_PARTIAL on one, ADDRESS_INACTIVE on none
    const votes: VoteData[] = [
      ...VoteFactory.createVotesForProposals(ADDRESS_ACTIVE, ['proposal-1', 'proposal-2', 'proposal-3'], testDaoId),
      VoteFactory.createVote(ADDRESS_PARTIAL, 'proposal-2', testDaoId)
    ];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for notification - should only be for ADDRESS_INACTIVE
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert') && 
             msg.text.includes(ADDRESS_INACTIVE.slice(0, 6)),
      { timeout: timeouts.notification.delivery }
    );

    expect(message.chatId).toBe(testConstants.profiles.p1.chatId);
    expect(message.text).toContain('hasn\'t voted in the last 3 proposals');
    expect(message.text).not.toContain(ADDRESS_ACTIVE.slice(0, 6));
    expect(message.text).not.toContain(ADDRESS_PARTIAL.slice(0, 6));
  });

  test('Edge case - less than 3 proposals, no notifications', async () => {
    const testDaoId = testConstants.daoIds.temporalTest2;
    
    // Create user following an address
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p2.chatId,
      'test_user_2',
      testDaoId,
      [ADDRESS_INACTIVE],
      true
    );

    // Create only 2 finished proposals
    const proposals = createFinishedProposals(testDaoId, 2);
    
    // No votes
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait and verify no messages are sent
    await telegramHelper.waitForNoMessages(3000);
  });

  test('Multiple users following same non-voting address', async () => {
    const testDaoId = testConstants.daoIds.temporalTest3;
    
    // Create two users following the same address
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p3.chatId,
      'user_one',
      testDaoId,
      [ADDRESS_INACTIVE],
      true
    );

    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p4.chatId,
      'user_two',
      testDaoId,
      [ADDRESS_INACTIVE],
      true
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);
    
    // No votes for ADDRESS_INACTIVE
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for both notifications
    const messages = await telegramHelper.waitForMessageCount(
      2,
      { 
        timeout: timeouts.notification.delivery,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify both users received notifications
    const chatIds = messages.map(m => m.chatId);
    expect(chatIds).toContain(testConstants.profiles.p3.chatId);
    expect(chatIds).toContain(testConstants.profiles.p4.chatId);
    
    // Verify content
    messages.forEach(message => {
      expect(message.text).toContain(ADDRESS_INACTIVE.slice(0, 6));
      expect(message.text).toContain('hasn\'t voted in the last 3 proposals');
    });
  });

  test('Partial voting does NOT generate notification', async () => {
    const testDaoId = testConstants.daoIds.temporalTest4;
    
    // Create user following 3 addresses with different voting patterns
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p5.chatId,
      'test_user_partial',
      testDaoId,
      [ADDRESS_ACTIVE, ADDRESS_PARTIAL, ADDRESS_ZERO_VOTES],
      true
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);
    
    // Create votes: 
    // ADDRESS_ACTIVE voted on 2/3
    // ADDRESS_PARTIAL voted on 1/3
    // ADDRESS_ZERO_VOTES voted on 0/3
    const votes: VoteData[] = [
      VoteFactory.createVote(ADDRESS_ACTIVE, 'proposal-1', testDaoId),
      VoteFactory.createVote(ADDRESS_ACTIVE, 'proposal-3', testDaoId),
      VoteFactory.createVote(ADDRESS_PARTIAL, 'proposal-2', testDaoId)
    ];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Should only get notification for ADDRESS_ZERO_VOTES
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert'),
      { timeout: timeouts.notification.delivery }
    );

    expect(message.text).toContain(ADDRESS_ZERO_VOTES.slice(0, 6));
    expect(message.text).not.toContain(ADDRESS_ACTIVE.slice(0, 6));
    expect(message.text).not.toContain(ADDRESS_PARTIAL.slice(0, 6));
  });

  test('No followed addresses - no processing', async () => {
    const testDaoId = testConstants.daoIds.temporalTest5;
    
    // Create user with subscription but no followed addresses
    await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p6.chatId,
      'user_no_addresses',
      testDaoId,
      true
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);
    
    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, []);

    // Wait and verify no messages are sent
    await telegramHelper.waitForNoMessages(3000);
  });

  test('Multiple DAOs - isolation between DAOs', async () => {
    const dao1 = 'uni';
    const dao2 = 'ens';
    
    // User 1 follows address in DAO1
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p8.chatId,
      'dao1_user',
      dao1,
      [ADDRESS_INACTIVE],
      true
    );

    // User 2 follows different address in DAO2
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p9.chatId,
      'dao2_user',
      dao2,
      [ADDRESS_ZERO_VOTES],
      true
    );

    // Create proposals for both DAOs
    const dao1Proposals = createFinishedProposals(dao1, 3);
    const dao2Proposals = createFinishedProposals(dao2, 3);
    
    // No votes in either DAO
    const votes: VoteData[] = [];

    // Setup mocks with both DAOs' proposals
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(), 
      [...dao1Proposals, ...dao2Proposals], 
      [], 
      {}, 
      votes
    );

    // Wait for notifications
    const messages = await telegramHelper.waitForMessageCount(
      2,
      { 
        timeout: timeouts.notification.delivery * 2,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify correct DAO isolation
    const dao1Message = messages.find(m => m.chatId === testConstants.profiles.p8.chatId);
    const dao2Message = messages.find(m => m.chatId === testConstants.profiles.p9.chatId);

    expect(dao1Message?.text).toContain('DAO UNI');
    expect(dao1Message?.text).toContain(ADDRESS_INACTIVE.slice(0, 6));
    
    expect(dao2Message?.text).toContain('DAO ENS');
    expect(dao2Message?.text).toContain(ADDRESS_ZERO_VOTES.slice(0, 6));
  });

  test('Duplicate prevention - same address in multiple events', async () => {
    const testDaoId = testConstants.daoIds.temporalTest8;
    
    // Create user following an address
    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p1.chatId,
      'test_duplicate',
      testDaoId,
      [ADDRESS_INACTIVE],
      true
    );

    // Create 4 proposals (to trigger multiple checks)
    // Only proposal-4 and proposal-3 will have 3 prior proposals to check
    // proposal-2 only has 2 prior (itself + proposal-1) 
    // proposal-1 only has 1 (itself)
    const proposals = createFinishedProposals(testDaoId, 4);
    
    // No votes
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Should receive 2 notifications: one for proposal-4 and one for proposal-3
    const messages = await telegramHelper.waitForMessageCount(
      2,
      { 
        timeout: timeouts.notification.delivery,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify both messages are for the same user
    expect(messages[0].chatId).toBe(testConstants.profiles.p1.chatId);
    expect(messages[1].chatId).toBe(testConstants.profiles.p1.chatId);
    
    // Check database for proper event_id deduplication
    const notifications = await dbHelper.getNotifications();
    const nonVotingNotifications = notifications.filter(n => 
      n.event_id.includes('non-voting')
    );
    
    // Should have 2 unique event_ids: one for proposal-4 and one for proposal-3
    expect(nonVotingNotifications.length).toBe(2);
    
    // Verify event IDs contain the address and are unique
    const eventIds = nonVotingNotifications.map(n => n.event_id);
    expect(eventIds[0]).toContain(ADDRESS_INACTIVE);
    expect(eventIds[1]).toContain(ADDRESS_INACTIVE);
    expect(eventIds[0]).toContain('non-voting');
    expect(eventIds[1]).toContain('non-voting');
    
    // Event IDs should be different (one for proposal-4, one for proposal-3)
    expect(new Set(eventIds).size).toBe(2);
  });
});