import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { setupTelegramMock } from '../src/mocks/telegram-mock-setup';
const mockSendMessage = setupTelegramMock();
import { db, closeDatabase } from '../src/setup/database-config';
import { setupDatabase } from '../src/setup/database';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { DaoFactory } from '../src/test-data/dao-factory';
import { UserFactory } from '../src/test-data/user-factory';
import { ProposalFactory } from '../src/test-data/proposal-factory';

describe('Temporal Filtering - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;

  beforeAll(async () => {
    // Clean up any existing test databases
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
    files.forEach(file => {
      fs.unlinkSync(`/tmp/${file}`);
    });

    await setupDatabase();
    
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

  test('should NOT notify users about proposals created BEFORE their subscription', async () => {
    // Create DAO for this test
    const testDao = await DaoFactory.createDao('TEMPORAL_DAO_1');
    const testDaoId = testDao.id;
    
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    // Create proposal BEFORE user subscription (older timestamp)
    const oldProposal = ProposalFactory.createProposal(testDaoId, 'old-proposal', {
      status: 'pending',
      timestamp: baseTime.toISOString() // 10:00 AM
    });
    
    // User subscribes AFTER proposal creation
    const subscriptionTime = new Date('2024-01-01T11:00:00Z'); // 11:00 AM
    await UserFactory.createUserWithFullSetup(
      '777777777', 
      'temporal_user', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [oldProposal]);
    
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should NOT send notifications for old proposals
    expect(newCallsCount).toBe(0);
  });

  test('should notify users about proposals created AFTER their subscription', async () => {
    // Create DAO for this test
    const testDao = await DaoFactory.createDao('TEMPORAL_DAO_2');
    const testDaoId = testDao.id;
    
    // User subscribes FIRST
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    await UserFactory.createUserWithFullSetup(
      '888888888', 
      'temporal_user_2', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // Create proposal AFTER user subscription (newer timestamp)
    const newProposal = ProposalFactory.createProposal(testDaoId, 'new-proposal', {
      status: 'pending'
    });

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [newProposal]);
    
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should send 1 notification for new proposal
    expect(newCallsCount).toBe(1);
    
    // Verify it was sent to the correct user
    const userCalls = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '888888888'
    );
    expect(userCalls.length).toBe(1);
  });

  test('should NOT notify about proposals created during unsubscribed period after resubscribing', async () => {
    const testDao = await DaoFactory.createDao('TEMPORAL_DAO_3');
    const testDaoId = testDao.id;
    
    // User subscribes initially
    const subscriptionTime = new Date('2024-01-01T10:00:00Z'); // 10:00 AM
    let testUser = await UserFactory.createUserWithFullSetup(
      '999999999', 
      'temporal_user_3', 
      testDaoId, 
      true, 
      subscriptionTime.toISOString()
    );

    // User unsubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, false, new Date('2024-01-01T12:00:00Z').toISOString());
    
    // Proposal created during inactive period (user should NOT be notified about this)
    const inactiveProposal = ProposalFactory.createProposal(testDaoId, 'during-inactive-proposal', {
      status: 'pending', 
      timestamp: new Date('2024-01-01T13:00:00Z').toISOString() // 1:00 PM
    });

    // User resubscribes
    await UserFactory.updateUserPreference(testUser.user.id, testDaoId, true, new Date('2024-01-01T14:00:00Z').toISOString());
    

    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [inactiveProposal]);    
    await new Promise(resolve => setTimeout(resolve, 5000));
    const newCallsCount = mockSendMessage.mock.calls.length;
    
    // Should NOT receive notification for proposal created during inactive period
    expect(newCallsCount).toBe(0);
  });
});