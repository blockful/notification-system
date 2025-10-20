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
    blockTime: 12,
  },
  
  // Test user profiles, combining chatId and a primary address
  profiles: {
    p1: { chatId: '6717185777', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'.toLowerCase() }, // vitalik.eth
    p2: { chatId: '222222222', address: '0x225f137127d9067788314bc7fcc1f36746a3c3B5'.toLowerCase() }, // nick.eth
    p3: { chatId: '333333333', address: '0x983110309620d911731ac0932219af06091b6744'.toLowerCase() }, // brantly.eth
    p4: { chatId: '555555555', address: '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'.toLowerCase() },
    p5: { chatId: '666666666', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'.toLowerCase() },
    p6: { chatId: '777777777', address: '0x225f137127d9067788314bc7fcc1f36746a3c3B5'.toLowerCase() },
    p7: { chatId: '888888888', address: '0x983110309620d911731ac0932219af06091b6744'.toLowerCase() },
    p8: { chatId: '999999999', address: '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'.toLowerCase() },
    p9: { chatId: 'user-with-subscription.eth', address: 'user-with-subscription.eth' },
    p10: { chatId: '101010101', address: '0x1e0E09b49eDB3bfA2E82ed4ab7F1260b9F49d067'.toLowerCase() },
    p10_checksum: { chatId: '101010101', address: '0x1e0E09b49eDB3bfA2E82ed4ab7F1260b9F49d067' },
  },

  // External addresses for events (actors not necessarily using the bot)
  eventActors: {
    delegator1: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    delegator2: '0x225f137127d9067788314bc7fcc1f36746a3c3B5', // nick.eth
    delegator3: '0x983110309620d911731ac0932219af06091b6744', // brantly.eth
    delegator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    recipient: '0x225f137127d9067788314bc7fcc1f36746a3c3B5', // nick.eth
    sender: '0x983110309620d911731ac0932219af06091b6744', // brantly.eth
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
    temporalTest4: 'TEMPORAL_DAO_4',
    temporalTest5: 'TEMPORAL_DAO_5',
    temporalTest6: 'TEMPORAL_DAO_6',
    temporalTest7: 'TEMPORAL_DAO_7',
    temporalTest8: 'TEMPORAL_DAO_8',
    temporalTest9: 'TEMPORAL_DAO_9',
    secondDao: 'second-dao',
    voteTest: 'test-dao-vote',
  },
  
  // Voting power test values
  votingPower: {
    default: '1000',
    small: '100',
    medium: '500',
  },
  
  // Proposal timing constants
  proposalTiming: {
    creationOffset: -60000, // 1 minute ago
    subscriptionOffset: -120000, // 2 minutes ago
    defaultStartBlock: 1000,
    proposalRunDuration: 50, // seconds
    finishOffset: -10, // seconds ago
    futureProposalBlocks: 90, // blocks for future proposals
  },
  
  // Fixed test dates for temporal tests
  testDates: {
    baseTime: '2024-01-01T12:00:00Z',
    proposalCreatedAt: '2024-01-01T10:00:00Z',
  },
};