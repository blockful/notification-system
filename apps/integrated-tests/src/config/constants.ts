/**
 * Shared constants for integration tests
 */

export const testConstants = {
  // Database table names (only used ones)
  tables: {
    notifications: 'notifications',
    users: 'users',
    userPreferences: 'user_preferences',
  },
  
  // Default test data
  defaults: {
    channelUserId: '123456789',
    channel: 'telegram' as const,
  },
  
  // Test user IDs
  testUsers: {
    user1: '111111111',
    user2: '222222222',
    user3: '333333333',
    user4: '555555555',
    user5: '666666666',
    user6: '777777777',
    user7: '888888888',
    user8: '999999999',
  },
  
  // Common DAO IDs for tests (only used ones)
  daoIds: {
    uniswap: 'UNISWAP',
    ens: 'ENS',
    votingPowerTest: 'test-dao-voting-power',
  },
  
  // Voting power test values (only used ones)
  votingPower: {
    default: '1000',
    small: '100',
  }
};