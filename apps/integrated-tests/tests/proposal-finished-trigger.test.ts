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

// Test constants
const TIMEOUTS = {
  SETUP: 120000,
  CLEANUP: 40000,
  PROCESSING_WAIT: 6000,
  PROPOSAL_FINISH_WAIT: 8000,
  FINAL_CLEANUP: 1000
} as const;

const TEST_CONFIG = {
  BLOCK_TIME: 12,
  PROPOSAL_OFFSET_SECONDS: -40,
  USER_SETUP_OFFSET_MS: -100000,
  SUBSCRIPTION_OFFSET_SECONDS: -300
} as const;

const TEST_IDENTIFIERS = {
  PRIMARY_DAO: 'test-dao-proposal-finished',
  SECONDARY_DAO: 'second-finished-dao',
  TEMPORAL_DAO: 'temporal-finished-dao',
  USER_WITH_SUB: 'user-with-subscription.eth',
  USER_WITHOUT_SUB: 'user-without-subscription.eth',
  SECONDARY_USER: 'second-dao-user.eth',
  TEMPORAL_USER: 'temporal-finished-user.eth',
  TELEGRAM_USER_1: '888888888',
  TELEGRAM_USER_2: '999999999'
} as const;

describe('Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let testDaoId: string;
  let testUserWithSubscription: string;
  let testUserWithoutSubscription: string;
  let secondDaoId: string;
  let secondUserAddress: string;

  // Helper functions
  const waitForProcessing = () => new Promise(resolve => 
    setTimeout(resolve, TIMEOUTS.PROCESSING_WAIT));

  const waitForProposalFinish = () => new Promise(resolve => 
    setTimeout(resolve, TIMEOUTS.PROPOSAL_FINISH_WAIT));

  const getNotificationCount = () => mockSendMessage.mock.calls.length;

  const getProposalNotifications = () => 
    mockSendMessage.mock.calls.filter(call => 
      call[1].includes('has ended'));

  const getNotificationsForUser = (userId: string) =>
    mockSendMessage.mock.calls.filter(call => 
      call[0].toString() === userId);

  const resetMocks = () => {
    jest.clearAllMocks();
    httpMockSetup.reset();
  };

  const createFinishedProposal = (daoId: string, proposalId: string) =>
    ProposalFactory.createTimedProposal(daoId, proposalId, TEST_CONFIG.PROPOSAL_OFFSET_SECONDS, TEST_CONFIG.BLOCK_TIME);

  beforeAll(async () => {
    // Clean up any existing test databases
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
    files.forEach(file => {
      fs.unlinkSync(`/tmp/${file}`);
    });

    // Initialize test data variables
    testDaoId = TEST_IDENTIFIERS.PRIMARY_DAO;
    testUserWithSubscription = TEST_IDENTIFIERS.USER_WITH_SUB;
    testUserWithoutSubscription = TEST_IDENTIFIERS.USER_WITHOUT_SUB;
    secondDaoId = TEST_IDENTIFIERS.SECONDARY_DAO;
    secondUserAddress = TEST_IDENTIFIERS.SECONDARY_USER;

    await setupDatabase();
    
    // Create users with subscription setup
    const pastTimestamp = new Date(Date.now() + TEST_CONFIG.USER_SETUP_OFFSET_MS).toISOString();
    const userSetup = await UserFactory.createUserWithFullSetup(testUserWithSubscription, 'proposal-finished-user', testDaoId, true, pastTimestamp);
    await UserFactory.createUserAddress(userSetup.user.id, testUserWithSubscription, pastTimestamp);
    await UserFactory.createUser(testUserWithoutSubscription, 'proposal-finished-user-2');
    
    // Create second DAO user setup
    const secondUser = await UserFactory.createUserWithFullSetup(
      TEST_IDENTIFIERS.TELEGRAM_USER_1,
      'second-dao-user',
      secondDaoId,
      true,
      pastTimestamp
    );
    await UserFactory.createUserAddress(secondUser.user.id, secondUserAddress, pastTimestamp);
    
    // Setup mocks
    httpMockSetup = new HttpClientMockSetup();

    // Start all applications
    apps = await startTestApps(db, httpMockSetup.getMockClient());
  }, TIMEOUTS.SETUP);

  beforeEach(async () => {
    resetMocks();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
    await new Promise(resolve => setTimeout(resolve, TIMEOUTS.FINAL_CLEANUP));
  }, TIMEOUTS.CLEANUP);

  test('should send notification when proposal finishes', async () => {
    const proposal = createFinishedProposal(testDaoId, 'finishing-proposal-1');
    
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [proposal], TEST_CONFIG.BLOCK_TIME, testDaoId, false);

    await waitForProposalFinish();

    expect(mockSendMessage).toHaveBeenCalled();
    
    const proposalNotifications = getProposalNotifications();
    expect(proposalNotifications.length).toBeGreaterThan(0);
  });

  test('should NOT send notification for proposals that have not finished yet', async () => {
    resetMocks();
    
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = now - 10;
    const startBlock = 1000;
    const endBlock = 1010; // Will finish in ~110 seconds
    
    const futureProposal = ProposalFactory.createProposal(testDaoId, 'future-proposal-1', {
      timestamp: startTimestamp.toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      status: 'active',
      description: '# Future Proposal\\n\\nThis proposal will not finish during the test.'
    });

    const initialCallCount = getNotificationCount();

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [futureProposal], TEST_CONFIG.BLOCK_TIME, testDaoId, false);

    await waitForProcessing();

    const finalCallCount = getNotificationCount();
    
    expect(finalCallCount).toBe(initialCallCount);
  });

  test('should process multiple finished proposals', async () => {
    resetMocks();
    
    const proposals = [
      createFinishedProposal(testDaoId, 'finished-1'),
      createFinishedProposal(testDaoId, 'finished-2'),
      createFinishedProposal(testDaoId, 'finished-3')
    ];

    const initialCallCount = getNotificationCount();

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals, TEST_CONFIG.BLOCK_TIME, testDaoId, false);

    await waitForProcessing();

    const finalCallCount = getNotificationCount();
    const newNotifications = finalCallCount - initialCallCount;
    
    expect(newNotifications).toBe(3);
    
    const recentCalls = mockSendMessage.mock.calls.slice(-3);
    expect(recentCalls[0][1]).toContain('Finished Proposal');
    expect(recentCalls[0][1]).toContain('has ended');
  });

  test('should NOT notify about proposals that finished before user subscription', async () => {
    const subscriptionTime = new Date();
    const user = await UserFactory.createUserWithFullSetup(
      TEST_IDENTIFIERS.TELEGRAM_USER_2,
      'temporal-user',
      TEST_IDENTIFIERS.TEMPORAL_DAO,
      true,
      subscriptionTime.toISOString()
    );
    
    const pastTimestamp = Math.floor(subscriptionTime.getTime() / 1000) + TEST_CONFIG.SUBSCRIPTION_OFFSET_SECONDS;
    const proposal = ProposalFactory.createProposal(TEST_IDENTIFIERS.TEMPORAL_DAO, 'old-finished-proposal', {
      timestamp: pastTimestamp.toString(),
      startBlock: 1000,
      endBlock: 1010,
      status: 'executed',
      description: '# Old Proposal\\n\\nThis finished before user subscribed.'
    });

    const initialCallCount = getNotificationCount();

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [proposal], TEST_CONFIG.BLOCK_TIME, testDaoId, false);

    await waitForProcessing();

    const finalCallCount = getNotificationCount();
    
    expect(finalCallCount).toBe(initialCallCount);
  });

  test('should handle proposals from multiple DAOs', async () => {
    const dao1Proposal = createFinishedProposal(testDaoId, 'dao1-finished');
    const dao2Proposal = createFinishedProposal(secondDaoId, 'dao2-finished');

    const initialCallCount = getNotificationCount();

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [dao1Proposal, dao2Proposal], TEST_CONFIG.BLOCK_TIME, testDaoId, false);

    await waitForProcessing();

    const finalCallCount = getNotificationCount();
    const newNotifications = finalCallCount - initialCallCount;
    
    expect(newNotifications).toBe(2);
    
    const userNotifications = getNotificationsForUser(testUserWithSubscription);
    const secondUserNotifications = getNotificationsForUser(TEST_IDENTIFIERS.TELEGRAM_USER_1);
    
    expect(userNotifications.length).toBeGreaterThan(0);
    expect(secondUserNotifications.length).toBeGreaterThan(0);
  });
});