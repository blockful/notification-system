import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
import { setupTelegramMock } from '../src/mocks/telegram-mock-setup';
const mockSendMessage = setupTelegramMock();
import { db, closeDatabase } from '../src/setup/database-config';
import { setupDatabase } from '../src/setup/database';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
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
    uniDaoId = 'UNISWAP';
    ensDaoId = 'ENS';
    
    // Create user that follows UNI with active preference
    const activeUser = await UserFactory.createUserWithFullSetup('111111111', 'active_user', uniDaoId, true, now);
    activeUserId = activeUser.user.id;
    
    // Create user that follows UNI but with INACTIVE preference
    const userWithInactiveUniPreference = await UserFactory.createUserWithFullSetup('555555555', 'inactive_pref_user', uniDaoId, false, now);
    inactiveUserId = userWithInactiveUniPreference.user.id;
    
    // Create user with inactive preference for ENS
    const userWithInactivePreference = await UserFactory.createUserWithFullSetup('666666666', 'user_inactive_pref', ensDaoId, false, now);
    userWithInactivePreferenceId = userWithInactivePreference.user.id;
  }

  test('should respect inactive preference states', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup proposals for both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos(['UNISWAP', 'ENS'], 'inactive-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 4500));
    
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

});