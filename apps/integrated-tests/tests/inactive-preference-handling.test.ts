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

describe('Inactive Preference Handling - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let ensDaoId: string;
  let activeUserId: string;
  let inactiveUserId: string;
  let userWithInactivePreferenceId: string;

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
    
    // Create user that follows UNI with active preference
    const activeUser = await UserFactory.createUserWithFullSetup('111111111', 'active_user', uniDaoId, true, true, now);
    activeUserId = activeUser.user.id;
    
    // Create user that follows UNI but with INACTIVE preference
    const userWithInactiveUniPreference = await UserFactory.createUserWithFullSetup('555555555', 'inactive_pref_user', uniDaoId, true, false, now);
    inactiveUserId = userWithInactiveUniPreference.user.id;
    
    // Create user with inactive preference for ENS
    const userWithInactivePreference = await UserFactory.createUserWithFullSetup('666666666', 'user_inactive_pref', ensDaoId, true, false, now);
    userWithInactivePreferenceId = userWithInactivePreference.user.id;
  }

  test('should respect inactive preference states', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup proposals for both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos(['UNISWAP', 'ENS'], 'inactive-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should only notify users with active preferences
    // Only the user with active UNI preference should be notified (1 notification)
    expect(newCallsCount).toBe(1);
    
    // Verify users with inactive preferences were NOT notified
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).not.toContain('555555555'); // User with inactive UNI preference
    expect(notifiedUsers).not.toContain('666666666'); // User with inactive ENS preference
    
    // Verify user with active preference was notified
    expect(notifiedUsers).toContain('111111111'); // User with active UNI preference
  });

  test('should not notify users with inactive preferences', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup UNI proposal specifically
    const uniProposal = ProposalFactory.createProposal('UNISWAP', 'inactive-preference-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [uniProposal]);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should only notify user with active preference (1 notification)
    expect(newCallsCount).toBe(1);
    
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).toContain('111111111'); // User with active preference
    expect(notifiedUsers).not.toContain('555555555'); // User with inactive preference should NOT be notified
  });

  test('should not notify users with inactive preferences for specific DAOs', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup ENS proposal specifically
    const ensProposal = ProposalFactory.createProposal('ENS', 'inactive-preference-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [ensProposal]);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should not notify anyone (0 notifications)
    expect(newCallsCount).toBe(0);
    
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).not.toContain('666666666'); // User with inactive preference should NOT be notified
  });
});