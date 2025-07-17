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

describe('Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let testDaoId: string;
  let testUserWithSubscription: string;
  let testUserWithoutSubscription: string;
  const blockTime = 12; // 12 seconds per block (Ethereum)

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
  }, 120000);

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

  const createTestData = async () => {
    testDaoId = 'test-dao-proposal-finished';
    testUserWithSubscription = 'user-with-subscription.eth';
    testUserWithoutSubscription = 'user-without-subscription.eth';

    // Create users in database with a timestamp from the past to ensure temporal filtering works
    const pastTimestamp = new Date(Date.now() - 100000).toISOString(); // 100 seconds ago (before any test proposal)
    
    const userWithSub = await UserFactory.createUser(testUserWithSubscription, 'proposal-finished-user');
    const userWithoutSub = await UserFactory.createUser(testUserWithoutSubscription, 'proposal-finished-user-2');

    // Create user preference (subscription equivalent) for proposal finished notifications
    const preference = await UserFactory.createUserPreference(userWithSub.id, testDaoId, true, pastTimestamp);
    
    // Create user address mapping to link user to wallet address
    await UserFactory.createUserAddress(userWithSub.id, testUserWithSubscription, pastTimestamp);
  };

  // Helper function to create a proposal that will finish soon
  const createFinishedProposal = (daoId: string, proposalId: string, secondsUntilEnd: number = 2) => {
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = now - 100; // Started 100 seconds ago
    const startBlock = 1000;
    const blocksElapsed = Math.floor(100 / blockTime); // How many blocks passed in 100 seconds
    const blocksUntilEnd = Math.ceil(secondsUntilEnd / blockTime); // How many blocks until it ends
    const endBlock = startBlock + blocksElapsed + blocksUntilEnd;
    
    return ProposalFactory.createProposal(daoId, proposalId, {
      timestamp: startTimestamp.toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      status: 'active', // Status doesn't matter for finished check
      description: '# Test Proposal Title\\n\\nThis is a test proposal that will finish soon.'
    });
  };

  // Helper function to create a proposal that already finished
  const createAlreadyFinishedProposal = (daoId: string, proposalId: string) => {
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = now - 50; // Started 50 seconds ago (after user subscription which is 100s ago)
    const startBlock = 1000;
    const endBlock = 1001; // 1 block = 12 seconds with blockTime=12, so it finished 38 seconds ago
    
    return ProposalFactory.createProposal(daoId, proposalId, {
      timestamp: startTimestamp.toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      status: 'executed',
      description: '# Finished Proposal\\n\\nThis proposal has already finished.'
    });
  };

  // Helper function to setup GraphQL mock without warnings
  const setupCleanGraphQLMock = (proposalsToReturn: any[] = []) => {
    httpMockSetup.getMockClient().post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatus = data.variables?.where?.status;
        const timestampGt = data.variables?.where?.timestamp_gt;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        
        // If new-proposal trigger is asking for pending proposals, return empty
        if (requestedStatus === 'pending') {
          return Promise.resolve({
            data: {
              data: {
                proposalsOnchains: {
                  items: []
                }
              }
            }
          });
        }
        
        // If proposal-finished trigger is asking with timestamp filter, return proposals
        if (timestampGt !== undefined) {
          let filteredProposals = proposalsToReturn;
          
          // Filter by DAO if specified
          if (requestedDaoId) {
            filteredProposals = filteredProposals.filter(p => p.daoId === requestedDaoId);
          }
          
          return Promise.resolve({
            data: {
              data: {
                proposalsOnchains: {
                  items: filteredProposals
                }
              }
            }
          });
        }
        
        // Default: return empty
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: []
              }
            }
          }
        });
      }
      
      // Handle voting power queries to avoid warnings
      if (data.query && data.query.includes('ListVotingPowerHistorys')) {
        return Promise.resolve({
          data: {
            data: {
              votingPowerHistorys: {
                items: []
              }
            }
          }
        });
      }
      
      if (data.query && data.query.includes('GetDAOs')) {
        const uniqueDaoIds = [...new Set(proposalsToReturn.map(p => p.daoId))];
        return Promise.resolve({
          data: {
            data: {
              daos: {
                items: uniqueDaoIds.length > 0 
                  ? uniqueDaoIds.map(daoId => ({ id: daoId, blockTime: blockTime }))
                  : [{ id: testDaoId, blockTime: blockTime }]
              }
            }
          }
        });
      }
      
      return Promise.resolve({ data: { data: {} } });
    });
  };

  test('should send notification when proposal finishes', async () => {
    // Create a proposal that has already finished
    const proposal = createAlreadyFinishedProposal(testDaoId, 'finishing-proposal-1');
    
    // Setup clean GraphQL mock without warnings
    setupCleanGraphQLMock([proposal]);

    // Wait for the logic system to process and the proposal to finish
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds to ensure proposal finishes

    // Verify that notification was sent
    expect(mockSendMessage).toHaveBeenCalled();
    
    // Find the notification for our proposal
    const proposalNotifications = mockSendMessage.mock.calls.filter(call => {
      const message = call[1];
      return message.includes('has ended');
    });
    
    expect(proposalNotifications.length).toBeGreaterThan(0);
  });

  test('should NOT send notification for proposals that have not finished yet', async () => {
    // Clear any previous mock calls
    jest.clearAllMocks();
    
    // Create a proposal that will finish in 60 seconds (well after our test)
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = now - 10; // Started 10 seconds ago
    const startBlock = 1000;
    const endBlock = 1010; // 10 blocks = 120 seconds, so it won't finish for 110 more seconds
    
    const futureProposal = ProposalFactory.createProposal(testDaoId, 'future-proposal-1', {
      timestamp: startTimestamp.toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      status: 'active',
      description: '# Future Proposal\\n\\nThis proposal will not finish during the test.'
    });

    // Setup clean GraphQL mock without warnings
    setupCleanGraphQLMock([futureProposal]);

    const initialCallCount = mockSendMessage.mock.calls.length;

    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));

    const finalCallCount = mockSendMessage.mock.calls.length;
    
    // Should not have sent any new notifications
    expect(finalCallCount).toBe(initialCallCount);
  });

  test('should process multiple finished proposals', async () => {
    // Clear any previous mock calls
    jest.clearAllMocks();
    
    // Create multiple proposals that have already finished
    const proposals = [
      createAlreadyFinishedProposal(testDaoId, 'finished-1'),
      createAlreadyFinishedProposal(testDaoId, 'finished-2'),
      createAlreadyFinishedProposal(testDaoId, 'finished-3')
    ];

    // Setup clean GraphQL mock without warnings
    setupCleanGraphQLMock(proposals);

    const initialCallCount = mockSendMessage.mock.calls.length;

    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));

    const finalCallCount = mockSendMessage.mock.calls.length;
    const newNotifications = finalCallCount - initialCallCount;
    
    // Should have sent notifications for all 3 finished proposals
    expect(newNotifications).toBe(3);
    
    // Verify each proposal got a notification
    const recentCalls = mockSendMessage.mock.calls.slice(-3);
    expect(recentCalls[0][1]).toContain('Finished Proposal');
    expect(recentCalls[0][1]).toContain('has ended');
  });

  test('should NOT notify about proposals that finished before user subscription', async () => {
    // Create new user and DAO for this test
    const temporalTestDaoId = 'temporal-finished-dao';
    const temporalTestUser = 'temporal-finished-user.eth';
    
    // User subscribes NOW
    const subscriptionTime = new Date();
    const user = await UserFactory.createUserWithFullSetup(
      '999999999',
      'temporal-user',
      temporalTestDaoId,
      true,
      subscriptionTime.toISOString()
    );
    
    // Create a proposal that finished BEFORE the subscription
    const pastTimestamp = Math.floor(subscriptionTime.getTime() / 1000) - 300; // 5 minutes before subscription
    const proposal = ProposalFactory.createProposal(temporalTestDaoId, 'old-finished-proposal', {
      timestamp: pastTimestamp.toString(),
      startBlock: 1000,
      endBlock: 1010, // Would have finished 3 minutes before subscription
      status: 'executed',
      description: '# Old Proposal\\n\\nThis finished before user subscribed.'
    });

    // Setup clean GraphQL mock without warnings
    setupCleanGraphQLMock([proposal]);

    const initialCallCount = mockSendMessage.mock.calls.length;

    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));

    const finalCallCount = mockSendMessage.mock.calls.length;
    
    // Should NOT have sent notification for old proposal
    expect(finalCallCount).toBe(initialCallCount);
  });

  test('should handle proposals from multiple DAOs', async () => {
    // Create another DAO and user
    const secondDaoId = 'second-finished-dao';
    const secondUserAddress = 'second-dao-user.eth';
    const secondUser = await UserFactory.createUserWithFullSetup(
      '888888888',
      'second-dao-user',
      secondDaoId,
      true,
      new Date(Date.now() - 100000).toISOString() // 100 seconds ago, same as first user
    );
    
    // Create user address mapping for the second user
    await UserFactory.createUserAddress(
      secondUser.user.id,
      secondUserAddress,
      new Date(Date.now() - 100000).toISOString() // 100 seconds ago, same as first user
    );
    
    // Create finished proposals for both DAOs
    const dao1Proposal = createAlreadyFinishedProposal(testDaoId, 'dao1-finished');
    const dao2Proposal = createAlreadyFinishedProposal(secondDaoId, 'dao2-finished');

    // Setup clean GraphQL mock without warnings
    setupCleanGraphQLMock([dao1Proposal, dao2Proposal]);

    const initialCallCount = mockSendMessage.mock.calls.length;

    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));

    const finalCallCount = mockSendMessage.mock.calls.length;
    const newNotifications = finalCallCount - initialCallCount;
    
    // Should have sent 2 notifications (one for each DAO to their respective subscribers)
    expect(newNotifications).toBe(2);
    
    // Verify each user got their DAO's notification
    const userNotifications = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === testUserWithSubscription
    );
    const secondUserNotifications = mockSendMessage.mock.calls.filter(
      call => call[0].toString() === '888888888'
    );
    
    expect(userNotifications.length).toBeGreaterThan(0);
    expect(secondUserNotifications.length).toBeGreaterThan(0);
  });
});