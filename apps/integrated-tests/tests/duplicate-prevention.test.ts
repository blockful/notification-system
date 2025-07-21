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

describe('Duplicate Prevention - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let uniFollowerUserId: string;
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
    
    // Create DAO
    uniDaoId = 'UNISWAP';
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
  }

  test('should not send duplicate notifications on repeated logic system triggers', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return the same UNI proposal consistently
    const persistentProposal = ProposalFactory.createProposal('UNISWAP', 'persistent-uni-proposal');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [persistentProposal]);
    
    // Wait for first round of notifications
    await new Promise(resolve => setTimeout(resolve, 4500));
    
    const firstRoundCallCount = mockSendMessage.mock.calls.length;
    const firstRoundNewCalls = firstRoundCallCount - initialCallCount;
    
    // Should have sent notifications in first round
    expect(firstRoundNewCalls).toBe(2); // UNI follower + both follower
    
    // Wait for second round (logic system triggers again with same proposal)
    await new Promise(resolve => setTimeout(resolve, 4500));
    
    const secondRoundCallCount = mockSendMessage.mock.calls.length;
    const secondRoundNewCalls = secondRoundCallCount - firstRoundCallCount;
    
    // Should NOT send duplicate notifications
    expect(secondRoundNewCalls).toBe(0);
  });
});