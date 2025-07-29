/**
 * Shared constants for integration tests
 */

export const testConstants = {
  // Database table names 
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
  
  // Test user profiles, combining chatId and a primary address
  profiles: {
    p1: { chatId: '111111111', address: '0xadd_p1' },
    p2: { chatId: '222222222', address: '0xadd_p2' },
    p3: { chatId: '333333333', address: '0xadd_p3' },
    p4: { chatId: '555555555', address: '0xadd_p4' },
    p5: { chatId: '666666666', address: '0xadd_p5' },
    p6: { chatId: '777777777', address: '0xadd_p6' },
    p7: { chatId: '888888888', address: '0xadd_p7' },
    p8: { chatId: '999999999', address: '0xadd_p8' },
    p9: { chatId: 'user-with-subscription.eth', address: 'user-with-subscription.eth' },
  },

  // External addresses for events (actors not necessarily using the bot)
  eventActors: {
    delegator1: 'delegator1.eth',
    delegator: 'delegator.eth',
    recipient: 'recipient.eth',
    sender: 'sender.eth',
    userPrefix: 'user',
  },
  
  // Common DAO IDs for tests 
  daoIds: {
    uniswap: 'UNISWAP',
    ens: 'ENS',
    votingPowerTest: 'test-dao-voting-power',
    caseTest: 'TEST_DAO',
    temporalTest1: 'TEMPORAL_DAO_1',
    temporalTest2: 'TEMPORAL_DAO_2',
    temporalTest3: 'TEMPORAL_DAO_3',
    secondDao: 'second-dao',
  },
  
  // Voting power test values 
  votingPower: {
    default: '1000',
    small: '100',
  },
};