import { User, Notification } from '../../interfaces/subscription-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';

// Test Data Factories
export function createProposalNotification(overrides: Partial<ProposalFinishedNotification> = {}): ProposalFinishedNotification {
  return {
    id: 'proposal-3',
    daoId: 'ENS',
    title: 'Proposal 3',
    description: 'Test proposal',
    endTimestamp: Date.now(),
    status: 'SUCCEEDED',
    forVotes: '1000000',
    againstVotes: '500000',
    abstainVotes: '100000',
    ...overrides
  };
}

export function createDispatcherMessage(events: ProposalFinishedNotification[]): DispatcherMessage<ProposalFinishedNotification> {
  return {
    triggerId: 'proposal-finished',
    events
  };
}

export function createProposal(id: string, title: string, daoId: string = 'ENS') {
  const now = Date.now();
  return {
    id,
    title,
    daoId,
    proposerAccountId: '0x123',
    description: `${title} description`,
    startBlock: 100,
    endBlock: 200,
    // Historical proposals should end before the current proposal-finished event.
    endTimestamp: now - 1000,
    timestamp: new Date(now - 2000).toISOString(),
    status: 'SUCCEEDED' as any,
    forVotes: '1000000',
    againstVotes: '500000',
    abstainVotes: '100000'
  };
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    channel: 'telegram',
    channel_user_id: '12345',
    created_at: new Date(),
    ...overrides
  };
}

export function createVote(voterAddress: string, proposalId: string) {
  return {
    voterAddress,
    proposalId
  };
}

export function createNotification(userId: string, eventId: string, daoId: string): Notification {
  return {
    user_id: userId,
    event_id: eventId,
    dao_id: daoId
  };
}

// Test Addresses
export const TestAddresses = {
  ADDRESS_1: '0x1234567890123456789012345678901234567123',
  ADDRESS_2: '0x1234567890123456789012345678901234567456', 
  ADDRESS_3: '0x1234567890123456789012345678901234567789',
  ADDRESS_LONG: '0x1234567890123456789012345678901234567890'
};

// Expected Messages
export const ExpectedMessages = {
  createNonVotingAlert: (daoId: string) =>
    `⚠️ Non-Voting Alert for DAO ${daoId}

The address {{nonVoterAddress}} that you follow hasn't voted in the last 3 proposals:

• Proposal 3
• Proposal 2
• Proposal 1

Consider reaching out to encourage participation!`
};
