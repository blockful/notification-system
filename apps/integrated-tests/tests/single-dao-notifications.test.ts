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

describe('Single DAO Notification Flow - Integration Test', () => {
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
      try {
        fs.unlinkSync(`/tmp/${file}`);
      } catch (e) {
        // Ignore if file doesn't exist
      }
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
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true, true, now);
    const ensFollower = await UserFactory.createUserWithFullSetup('222222222', 'ens_follower', ensDaoId, true, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    ensFollowerUserId = ensFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollowerUserId, ensDaoId, true, now);
    await UserFactory.createSubscription(bothFollowerUserId, ensDaoId, now);
  }

  test('UNI proposal should notify only UNI followers', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active UNI proposal
    const uniProposal = ProposalFactory.createProposal('UNISWAP', 'uni-proposal-1');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [uniProposal]);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have exactly 2 new calls (UNI follower + both follower)
    expect(newCallsCount).toBe(2);
    
    // Verify both users received the notification
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).toContain('111111111'); // UNI follower
    expect(notifiedUsers).toContain('333333333'); // Both follower
    expect(notifiedUsers).not.toContain('222222222'); // ENS follower should NOT be notified
  });

  test('ENS proposal should notify only ENS followers', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active ENS proposal
    const ensProposal = ProposalFactory.createProposal('ENS', 'ens-proposal-1');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [ensProposal]);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have exactly 2 new calls (ENS follower + both follower)
    expect(newCallsCount).toBe(2);
    
    // Verify both users received the notification
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).toContain('222222222'); // ENS follower
    expect(notifiedUsers).toContain('333333333'); // Both follower
    expect(notifiedUsers).not.toContain('111111111'); // UNI follower should NOT be notified
  });
});