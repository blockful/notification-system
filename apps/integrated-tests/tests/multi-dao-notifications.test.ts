import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
import { setupTelegramMock } from '../src/mocks/telegram-mock-setup';
const mockSendMessage = setupTelegramMock();

// Now import other modules
import { db, closeDatabase } from '../src/setup/database-config';
import { setupDatabase } from '../src/setup/database';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { DaoFactory } from '../src/test-data/dao-factory';
import { UserFactory } from '../src/test-data/user-factory';
import { ProposalFactory } from '../src/test-data/proposal-factory';

describe('Multi-DAO Notification Flow - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let ensDaoId: string;
  let uniFollowerUserId: string;
  let ensFollowerUserId: string;
  let bothFollowerUserId: string;

  beforeAll(async () => {
    // Clean up any existing test databases
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
    files.forEach(file => {
      fs.unlinkSync(`/tmp/${file}`);
    });

    await setupDatabase();
    await createTestData();
    
    // Setup mocks
    httpMockSetup = new HttpClientMockSetup();

    // Start all applications
    apps = await startTestApps(db, httpMockSetup.getMockClient());
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
    // Give some time for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 40000);

  async function createTestData() {
    const now = new Date().toISOString();
    
    // Create DAOs
    const uniDao = await DaoFactory.createDao('UNISWAP');
    const ensDao = await DaoFactory.createDao('ENS');
    uniDaoId = uniDao.id;
    ensDaoId = ensDao.id;
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true, now);
    const ensFollower = await UserFactory.createUserWithFullSetup('222222222', 'ens_follower', ensDaoId, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    ensFollowerUserId = ensFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollowerUserId, ensDaoId, true, now);
    await UserFactory.createSubscription(bothFollowerUserId, ensDaoId, now);
  }

  test('Both DAOs proposals should notify user following both DAOs twice', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active proposals from both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos(['UNISWAP', 'ENS'], 'multi-proposal');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have 4 calls total:
    // - 1 to UNI follower (UNI proposal)
    // - 1 to ENS follower (ENS proposal)  
    // - 2 to both follower (UNI + ENS proposals)
    expect(newCallsCount).toBe(4);
    
    // Verify both follower received 2 messages
    const bothFollowerCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '333333333'
    );
    expect(bothFollowerCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle multiple simultaneous proposals from same DAO', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup multiple UNI proposals simultaneously
    const multipleUniProposals = ProposalFactory.createMultipleProposals('UNISWAP', 3, 'uni-multi');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), multipleUniProposals);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should send 3 proposals × 2 users (UNI followers) = 6 notifications
    // Users: 111111111 (UNI follower) + 333333333 (both follower)
    expect(newCallsCount).toBe(6);
    
    // Verify both UNI followers received notifications for all 3 proposals
    const uniFollowerCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '111111111'
    );
    const bothFollowerCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '333333333'
    );
    
    expect(uniFollowerCalls.length).toBe(3); // 3 proposals
    expect(bothFollowerCalls.length).toBe(3); // 3 proposals
    
    // Verify ENS follower did NOT receive UNI notifications
    const ensFollowerCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '222222222'
    );
    expect(ensFollowerCalls.length).toBe(0);
  });

  test('should notify only new user when added to DAO with existing active proposals', async () => {
    // First, setup UNI proposal and wait for initial notifications
    const uniProposal = ProposalFactory.createProposal('UNISWAP', 'existing-uni-proposal');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [uniProposal]);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const beforeNewUserCallCount = mockSendMessage.mock.calls.length;
    
    // Add a new user that subscribes to UNISWAP
    const now = new Date().toISOString();
    await UserFactory.createUserWithFullSetup('444444444', 'new_uni_follower', 'UNISWAP', true, now);
    
    // Wait for logic system to trigger again
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const afterNewUserCallCount = mockSendMessage.mock.calls.length;
    const newCallsForNewUser = afterNewUserCallCount - beforeNewUserCallCount;
    
    // Should have exactly 1 new call (only for the new user)
    expect(newCallsForNewUser).toBe(1);
    
    // Verify it was sent to the new user
    const newUserCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '444444444'
    );
    expect(newUserCalls.length).toBe(1);
  });
});