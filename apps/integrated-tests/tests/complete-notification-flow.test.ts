import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
import { setupTelegramMock } from '../src/config/mocks';
const mockSendMessage = setupTelegramMock();

// Now import other modules
import { db, closeDatabase } from '../src/config/database';
import { setupDatabase, createTestData } from '../src/setup/database';
import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import axios from 'axios';

// Mock data factories
const createMockProposal = (daoId: string, status: string) => ({
  id: "test-proposal-1",
  daoId,
  status,
  description: "# Test Proposal\\n\\nThis is a test proposal for integration testing.",
  // Minimal required fields
  abstainVotes: "0",
  againstVotes: "0", 
  forVotes: "1000000000000000000000",
  calldatas: ["0x"],
  endBlock: "16575874",
  proposerAccountId: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
  startBlock: "16530056",
  signatures: [""],
  targets: ["0x2686A8919Df194aA7673244549E68D42C1685d03"],
  timestamp: "1675207295",
  values: ["1000000000000000000"]
});

const createGraphQLMockResponse = (daoId: string, status: string, queryType: string) => {
  const isListProposals = queryType === 'ListProposals';
  const isGetDAOs = queryType === 'GetDAOs';
  const shouldReturnProposals = isListProposals && status === 'ACTIVE';
  
  return {
    data: {
      data: {
        proposalsOnchains: {
          items: shouldReturnProposals ? [createMockProposal(daoId, status)] : []
        },
        daos: {
          items: isGetDAOs ? [{ id: daoId }] : []
        }
      }
    }
  };
};

describe('Complete Notification Flow - Full Integration Test', () => {
  let consumerApp: ConsumerApp;
  let logicSystemApp: LogicSystemApp;
  let dispatcherApp: DispatcherApp;
  let subscriptionServerApp: SubscriptionServerApp;

  let mockProposalStatus = 'PENDING';
  let testDaoId: string;

  // Create minimal mock HTTP client
  const mockHttpClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  } as any;

  const setupGraphQLMock = () => {
    (mockHttpClient.post as jest.Mock).mockImplementation((url: any, body: any) => {
      if (!body.query) {
        return Promise.resolve({ data: { success: true } });
      }

      const queryType = body.query.includes('ListProposals') ? 'ListProposals' :
                       body.query.includes('GetDAOs') ? 'GetDAOs' : 'Unknown';
      
      const hasActiveFilter = body.variables?.where?.status === 'active';
      const effectiveStatus = queryType === 'ListProposals' && hasActiveFilter ? mockProposalStatus : 'PENDING';
      
      return Promise.resolve(createGraphQLMockResponse(testDaoId, effectiveStatus, queryType));
    });
  };

  beforeAll(async () => {
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }

    await setupDatabase();
    const testData = await createTestData();
    testDaoId = testData.testDao.id;
    
    setupGraphQLMock();

    // Start all services
    subscriptionServerApp = new SubscriptionServerApp(db, 14001);
    await subscriptionServerApp.start();
    
    dispatcherApp = new DispatcherApp(13002, 'http://127.0.0.1:14001', 'http://127.0.0.1:14002');
    await dispatcherApp.start();
    
    consumerApp = new ConsumerApp(
      'http://mocked-endpoint.com/graphql', 
      '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY',
      'http://127.0.0.1:14001', 
      14002, 
      mockHttpClient
    );
    await consumerApp.start();
    
    logicSystemApp = new LogicSystemApp(
      'http://mocked-endpoint.com/graphql',
      'http://127.0.0.1:13002/messages',
      5000,
      'active',
      mockHttpClient,
      axios.create() as any
    );
    logicSystemApp.start();
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (logicSystemApp) {
      await logicSystemApp.stop();
    }
    if (consumerApp) {
      await consumerApp.stop();
    }
    if (dispatcherApp) {
      await dispatcherApp.stop();
    }
    if (subscriptionServerApp) {
      await subscriptionServerApp.stop();
    }

    closeDatabase();
  });

  test('should complete full notification flow: proposal added -> logic-system -> dispatcher -> subscription-api -> consumer -> telegraf', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    mockProposalStatus = 'ACTIVE';
    
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    expect(newCallsCount).toBeGreaterThan(0);
    expect(mockSendMessage).toHaveBeenCalled();
  });
}); 