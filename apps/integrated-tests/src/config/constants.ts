/**
 * Shared constants for integration tests
 */

export const testConstants = {
  // Default test data
  defaults: {
    daoId: 'test-dao-id',
    channelUserId: '123456789',
    channel: 'telegram' as const,
  },
  
  // Queue names
  queues: {
    notifications: 'notifications',
    triggers: 'triggers',
  },
  
  // Exchange names
  exchanges: {
    notifications: 'notifications',
    triggers: 'triggers',
  },
  
  // Routing keys
  routingKeys: {
    newProposal: 'new-proposal',
    proposalFinished: 'proposal-finished',
    votingPower: 'voting-power',
  },
  
  // Test proposal statuses
  proposalStatuses: {
    pending: 'PENDING',
    active: 'ACTIVE',
    succeeded: 'SUCCEEDED',
    defeated: 'DEFEATED',
    expired: 'EXPIRED',
    canceled: 'CANCELED',
  },
  
  // Mock data identifiers
  mockIds: {
    proposal: 'test-proposal-1',
    user: 'test-user-1',
    event: 'test-event-1',
  }
};