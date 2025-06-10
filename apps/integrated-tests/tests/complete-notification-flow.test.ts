import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
import { setupTelegramMock } from '../src/config/mocks';
const mockSendMessage = setupTelegramMock();

// Now import other modules
import { db, closeDatabase } from '../src/config/database';
import { setupDatabase, createTestData } from '../src/setup/database';
import { createMockHttpClient, setupGraphQLMock } from '../src/config/http-client-mock';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';

describe('Complete Notification Flow - Full Integration Test', () => {
  let apps: TestApps;
  let mockProposalStatus = 'PENDING';
  let testDaoId: string;
  let mockHttpClient: any;

  beforeAll(async () => {
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }

    await setupDatabase();
    const testData = await createTestData();
    testDaoId = testData.testDao.id;
    
    // Setup mocks
    mockHttpClient = createMockHttpClient();
    setupGraphQLMock(mockHttpClient, testDaoId, mockProposalStatus);

    // Start all applications
    apps = await startTestApps(db, mockHttpClient);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
  });

  test('should complete full notification flow: proposal added -> logic-system -> dispatcher -> subscription-api -> consumer -> telegraf', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Update mock to return active proposals
    mockProposalStatus = 'ACTIVE';
    setupGraphQLMock(mockHttpClient, testDaoId, mockProposalStatus);
    
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    expect(newCallsCount).toBeGreaterThan(0);
    expect(mockSendMessage).toHaveBeenCalled();
  });
}); 