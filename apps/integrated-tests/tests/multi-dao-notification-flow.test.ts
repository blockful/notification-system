import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
import { setupTelegramMock } from '../src/config/mocks';
const mockSendMessage = setupTelegramMock();

// Now import other modules
import { db, closeDatabase } from '../src/config/database';
import { setupDatabase } from '../src/setup/database';
import { createMockHttpClient, setupGraphQLMock } from '../src/config/http-client-mock';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { v4 as uuidv4 } from 'uuid';

describe('Multi-DAO Notification Flow - Integration Test', () => {
  let apps: TestApps;
  let mockHttpClient: any;
  let uniDaoId: string;
  let ensDaoId: string;
  let uniFollowerUserId: string;
  let ensFollowerUserId: string;
  let bothFollowerUserId: string;

  beforeAll(async () => {
    if (fs.existsSync('/tmp/test_integration.db')) {
      fs.unlinkSync('/tmp/test_integration.db');
    }

    await setupDatabase();
    await createMultiDaoTestData();
    
    // Setup mocks
    mockHttpClient = createMockHttpClient();

    // Start all applications
    apps = await startTestApps(db, mockHttpClient);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset mock to ensure clean state between tests
    mockHttpClient.post.mockReset();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
  });

  async function createMultiDaoTestData() {
    const now = new Date().toISOString();
    
    // Create DAOs
    const uniDao = await createDao('UNISWAP');
    const ensDao = await createDao('ENS');
    uniDaoId = uniDao.id;
    ensDaoId = ensDao.id;
    
    // Create Users
    const uniFollower = await createUser('111111111', 'uni_follower');
    const ensFollower = await createUser('222222222', 'ens_follower');
    const bothFollower = await createUser('333333333', 'both_follower');
    
    uniFollowerUserId = uniFollower.id;
    ensFollowerUserId = ensFollower.id;
    bothFollowerUserId = bothFollower.id;
    
    // Create User Preferences and Subscriptions
    await createUserPreferenceAndSubscription(uniFollowerUserId, uniDaoId, now);
    await createUserPreferenceAndSubscription(ensFollowerUserId, ensDaoId, now);
    await createUserPreferenceAndSubscription(bothFollowerUserId, uniDaoId, now);
    await createUserPreferenceAndSubscription(bothFollowerUserId, ensDaoId, now);
  }

  async function createDao(daoName: string) {
    const dao = {
      id: daoName // Using DAO name as ID to match GraphQL queries
    };
    await db('dao').insert(dao);
    return dao;
  }

  async function createUser(channelUserId: string, name: string) {
    const user = {
      id: uuidv4(),
      channel: 'telegram',
      channel_user_id: channelUserId,
      is_active: true,
      created_at: new Date().toISOString()
    };
    await db('users').insert(user);
    return user;
  }

  async function createUserPreferenceAndSubscription(userId: string, daoId: string, timestamp: string) {
    // Create user preference
    const preference = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp
    };
    await db('user_preferences').insert(preference);

    // Create subscription
    const subscription = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      notification_type: 'proposal_created',
      notification_channels: JSON.stringify(['telegram']),
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp
    };
    await db('subscriptions').insert(subscription);
  }

  function setupMockWithActiveProposal(daoId: string, proposalId: string) {
    const mockProposal = {
      id: proposalId,
      daoId: daoId,
      proposerAccountId: uuidv4(),
      targets: ['0xtarget1'],
      values: ['0'],
      signatures: ['transfer(address,uint256)'],
      calldatas: ['0xabcdef1234567890'],
      startBlock: 12345678,
      endBlock: 12345978,
      description: `Test ${daoId} proposal`,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      forVotes: '1000000000000000000',
      againstVotes: '500000000000000000',
      abstainVotes: '200000000000000000'
    };

    mockHttpClient.post.mockImplementation((url: string, data: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const hasActiveFilter = data.variables?.where?.status === 'active';
        const proposalsToReturn = hasActiveFilter ? [mockProposal] : [];
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
              }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
  }

  test('UNI proposal should notify only UNI follower', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active UNI proposal
    setupMockWithActiveProposal('UNISWAP', 'uni-proposal-1');
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have exactly 2 new calls (UNI follower + both follower)
    expect(newCallsCount).toBe(2);
    
    // Verify both users received the notification
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).toContain('111111111'); // UNI follower
    expect(notifiedUsers).toContain('333333333'); // Both follower
  });

  test('ENS proposal should notify only ENS follower', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active ENS proposal
    setupMockWithActiveProposal('ENS', 'ens-proposal-1');
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have exactly 2 new calls (ENS follower + both follower)
    expect(newCallsCount).toBe(2);
    
    // Verify both users received the notification
    const newCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = newCalls.map(call => call[0].toString());
    expect(notifiedUsers).toContain('222222222'); // ENS follower
    expect(notifiedUsers).toContain('333333333'); // Both follower
  });

  test('Both DAOs proposals should notify user following both DAOs twice', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return active proposals from both DAOs
    const mockProposals = [
      {
        id: 'uni-proposal-2',
        daoId: 'UNISWAP',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget1'],
        values: ['0'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567890'],
        startBlock: 12345678,
        endBlock: 12345978,
        description: 'Test UNISWAP proposal',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '1000000000000000000',
        againstVotes: '500000000000000000',
        abstainVotes: '200000000000000000'
      },
      {
        id: 'ens-proposal-2',
        daoId: 'ENS',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget2'],
        values: ['0'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567891'],
        startBlock: 12345679,
        endBlock: 12345979,
        description: 'Test ENS proposal',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '2000000000000000000',
        againstVotes: '1000000000000000000',
        abstainVotes: '300000000000000000'
      }
    ];

    mockHttpClient.post.mockImplementation((url: string, data: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const hasActiveFilter = data.variables?.where?.status === 'active';
        const proposalsToReturn = hasActiveFilter ? mockProposals : [];
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
              }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should have 4 calls total:
    // - 1 to UNI follower (UNI proposal)
    // - 1 to ENS follower (ENS proposal)  
    // - 2 to both follower (UNI + ENS proposals)
    expect(newCallsCount).toBe(4);
    
    // Verify both follower received 2 messages
    const allCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const bothFollowerCalls = allCalls.filter(
      call => call[0].toString() === '333333333' // Both follower's channel_user_id
    );
    expect(bothFollowerCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('should not send duplicate notifications on repeated logic system triggers', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup mock to return the same UNI proposal consistently
    setupMockWithActiveProposal('UNISWAP', 'persistent-uni-proposal');
    
    // Wait for first round of notifications
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const firstRoundCallCount = mockSendMessage.mock.calls.length;
    const firstRoundNewCalls = firstRoundCallCount - initialCallCount;
    
    // Should have sent notifications in first round
    expect(firstRoundNewCalls).toBe(2); // UNI follower + both follower
    
    // Wait for second round (logic system triggers again with same proposal)
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const secondRoundCallCount = mockSendMessage.mock.calls.length;
    const secondRoundNewCalls = secondRoundCallCount - firstRoundCallCount;
    
    // Should NOT send duplicate notifications
    expect(secondRoundNewCalls).toBe(0);
  });

  test('should notify only new user when added to DAO with existing active proposals', async () => {
    // First, setup UNI proposal and wait for initial notifications
    setupMockWithActiveProposal('UNISWAP', 'existing-uni-proposal');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const beforeNewUserCallCount = mockSendMessage.mock.calls.length;
    
    // Add a new user that subscribes to UNISWAP
    const newUser = await createUser('444444444', 'new_uni_follower');
    const now = new Date().toISOString();
    await createUserPreferenceAndSubscription(newUser.id, 'UNISWAP', now);
    
    // Wait for logic system to trigger again
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const afterNewUserCallCount = mockSendMessage.mock.calls.length;
    const newCallsForNewUser = afterNewUserCallCount - beforeNewUserCallCount;
    
    // Should have exactly 1 new call (only for the new user)
    expect(newCallsForNewUser).toBe(1);
    
    // Verify it was sent to the new user
    const lastCall = mockSendMessage.mock.calls[mockSendMessage.mock.calls.length - 1];
    expect(lastCall[0].toString()).toBe('444444444'); // New user's channel_user_id
  });

  test('should respect inactive user and preference states', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Create inactive user that follows UNI
    const inactiveUser = await createInactiveUser('555555555', 'inactive_user');
    const now = new Date().toISOString();
    await createUserPreferenceAndSubscription(inactiveUser.id, 'UNISWAP', now);
    
    // Create active user with inactive preference for ENS
    const userWithInactivePreference = await createUser('666666666', 'user_inactive_pref');
    await createInactiveUserPreference(userWithInactivePreference.id, 'ENS', now);
    
    // Setup proposals for both DAOs
    const mockProposals = [
      {
        id: 'uni-inactive-test',
        daoId: 'UNISWAP',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget1'],
        values: ['0'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567890'],
        startBlock: 12345678,
        endBlock: 12345978,
        description: 'Test UNI proposal for inactive states',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '1000000000000000000',
        againstVotes: '500000000000000000',
        abstainVotes: '200000000000000000'
      },
      {
        id: 'ens-inactive-test',
        daoId: 'ENS',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget2'],
        values: ['0'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567891'],
        startBlock: 12345679,
        endBlock: 12345979,
        description: 'Test ENS proposal for inactive states',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '2000000000000000000',
        againstVotes: '1000000000000000000',
        abstainVotes: '300000000000000000'
      }
    ];

    mockHttpClient.post.mockImplementation((url: string, data: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const hasActiveFilter = data.variables?.where?.status === 'active';
        const proposalsToReturn = hasActiveFilter ? mockProposals : [];
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
              }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should only notify active users with active preferences
    // UNI: original users (111111111 + 333333333) = 2 notifications
    // ENS: only original users (222222222 + 333333333) = 2 notifications  
    // Inactive user (555555555) should NOT be notified
    // User with inactive ENS preference (666666666) should NOT be notified for ENS
    expect(newCallsCount).toBe(4);
    
    // Verify inactive user was NOT notified
    const allCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const notifiedUsers = allCalls.map(call => call[0].toString());
    expect(notifiedUsers).not.toContain('555555555'); // Inactive user
    expect(notifiedUsers).not.toContain('666666666'); // User with inactive preference
    
    // Verify active users were still notified
    expect(notifiedUsers).toContain('111111111'); // UNI follower
    expect(notifiedUsers).toContain('222222222'); // ENS follower
    expect(notifiedUsers).toContain('333333333'); // Both follower (should appear twice)
  });

  test('should handle multiple simultaneous proposals from same DAO', async () => {
    const initialCallCount = mockSendMessage.mock.calls.length;
    
    // Setup multiple UNI proposals simultaneously
    const multipleUniProposals = [
      {
        id: 'uni-multi-1',
        daoId: 'UNISWAP',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget1'],
        values: ['100'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567890'],
        startBlock: 12345678,
        endBlock: 12345978,
        description: 'First UNI proposal',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '1000000000000000000',
        againstVotes: '500000000000000000',
        abstainVotes: '200000000000000000'
      },
      {
        id: 'uni-multi-2',
        daoId: 'UNISWAP',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget2'],
        values: ['200'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567891'],
        startBlock: 12345680,
        endBlock: 12345980,
        description: 'Second UNI proposal',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '1500000000000000000',
        againstVotes: '600000000000000000',
        abstainVotes: '250000000000000000'
      },
      {
        id: 'uni-multi-3',
        daoId: 'UNISWAP',
        proposerAccountId: uuidv4(),
        targets: ['0xtarget3'],
        values: ['300'],
        signatures: ['transfer(address,uint256)'],
        calldatas: ['0xabcdef1234567892'],
        startBlock: 12345682,
        endBlock: 12345982,
        description: 'Third UNI proposal',
        timestamp: new Date().toISOString(),
        status: 'ACTIVE',
        forVotes: '2000000000000000000',
        againstVotes: '700000000000000000',
        abstainVotes: '300000000000000000'
      }
    ];

    mockHttpClient.post.mockImplementation((url: string, data: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const hasActiveFilter = data.variables?.where?.status === 'active';
        const proposalsToReturn = hasActiveFilter ? multipleUniProposals : [];
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
              }
            }
          }
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    
    // Wait for the logic system to process
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const finalCallCount = mockSendMessage.mock.calls.length;
    const newCallsCount = finalCallCount - initialCallCount;
    
    // Should send 3 proposals × 2 users (UNI followers) = 6 notifications
    // Users: 111111111 (UNI follower) + 333333333 (both follower)
    expect(newCallsCount).toBe(6);
    
    // Verify both UNI followers received notifications for all 3 proposals
    const allCalls = mockSendMessage.mock.calls.slice(initialCallCount);
    const uniFollowerCalls = allCalls.filter(call => call[0].toString() === '111111111');
    const bothFollowerCalls = allCalls.filter(call => call[0].toString() === '333333333');
    
    expect(uniFollowerCalls.length).toBe(3); // 3 proposals
    expect(bothFollowerCalls.length).toBe(3); // 3 proposals
    
    // Verify ENS follower did NOT receive UNI notifications
    const ensFollowerCalls = allCalls.filter(call => call[0].toString() === '222222222');
    expect(ensFollowerCalls.length).toBe(0);
    
    // Test deduplication works per proposal - wait for another round
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const afterSecondRoundCallCount = mockSendMessage.mock.calls.length;
    const secondRoundNewCalls = afterSecondRoundCallCount - finalCallCount;
    
    // Should be 0 - no duplicate notifications for same proposals
    expect(secondRoundNewCalls).toBe(0);
  });

  // Helper functions for new test scenarios
  async function createInactiveUser(channelUserId: string, name: string) {
    const user = {
      id: uuidv4(),
      channel: 'telegram',
      channel_user_id: channelUserId,
      is_active: false, // Inactive user
      created_at: new Date().toISOString()
    };
    await db('users').insert(user);
    return user;
  }

  async function createInactiveUserPreference(userId: string, daoId: string, timestamp: string) {
    // Create inactive user preference
    const preference = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      is_active: false, // Inactive preference
      created_at: timestamp,
      updated_at: timestamp
    };
    await db('user_preferences').insert(preference);

    const subscription = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      notification_type: 'proposal_created',
      notification_channels: JSON.stringify(['telegram']),
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp
    };
    await db('subscriptions').insert(subscription);
  }
});