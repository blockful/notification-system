import { NonVotingHandler } from './non-voting-handler.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { 
  createProposalNotification, 
  createDispatcherMessage, 
  createProposal, 
  createUser, 
  createVote, 
  createNotification,
  TestAddresses,
  ExpectedMessages 
} from './non-voting-handler.test-factory';

describe('NonVotingHandler', () => {
  let handler: NonVotingHandler;
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let mockAnticaptureClient: jest.Mocked<AnticaptureClient>;

  beforeEach(() => {
    mockSubscriptionClient = {
      getDaoSubscribers: jest.fn(),
      shouldSend: jest.fn(),
      markAsSent: jest.fn(),
      getWalletOwners: jest.fn(),
      getWalletOwnersBatch: jest.fn(),
      getFollowedAddresses: jest.fn()
    };

    mockNotificationClient = {
      sendNotification: jest.fn().mockResolvedValue(undefined)
    };

    mockNotificationFactory = {
      getClient: jest.fn().mockReturnValue(mockNotificationClient),
      addClient: jest.fn()
    } as any;

    mockAnticaptureClient = {
      listProposals: jest.fn(),
      listVotesOnchains: jest.fn(),
      getDAOs: jest.fn(),
      getProposalById: jest.fn(),
      listVotingPowerHistory: jest.fn()
    } as any;

    handler = new NonVotingHandler(
      mockSubscriptionClient,
      mockNotificationFactory,
      mockAnticaptureClient
    );
  });

  it('should identify and notify about non-voting addresses', async () => {
    // Setup test data using factories
    const message = createDispatcherMessage([
      createProposalNotification()
    ]);

    const followedAddresses = [TestAddresses.ADDRESS_1, TestAddresses.ADDRESS_2, TestAddresses.ADDRESS_3];
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1')
    ];

    const votes = [
      createVote(TestAddresses.ADDRESS_1, 'proposal-1'),
      createVote(TestAddresses.ADDRESS_1, 'proposal-2')
    ];

    const followers = [createUser()];

    // Setup mocks
    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(followedAddresses);
    mockAnticaptureClient.listVotesOnchains.mockResolvedValue(votes as any);
    
    // Mock the batch method instead of individual calls
    mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
      [TestAddresses.ADDRESS_2]: followers,
      [TestAddresses.ADDRESS_3]: followers
    });
    
    // Mock shouldSend to return notifications for all addresses based on eventId
    mockSubscriptionClient.shouldSend.mockImplementation((followers, eventId, daoId) => {
      if (eventId.includes(TestAddresses.ADDRESS_2)) {
        return Promise.resolve([createNotification('user-1', eventId, daoId)]);
      }
      if (eventId.includes(TestAddresses.ADDRESS_3)) {
        return Promise.resolve([createNotification('user-1', eventId, daoId)]);
      }
      return Promise.resolve([]);
    });

    // Execute
    const result = await handler.handleMessage(message);

    // Verify
    expect(result.messageId).toBe('proposal-finished');
    expect(mockAnticaptureClient.listProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.arrayContaining(['SUCCEEDED']),
        limit: 3
      }),
      'ENS'
    );
    expect(mockSubscriptionClient.getFollowedAddresses).toHaveBeenCalledWith('ENS');
    expect(mockAnticaptureClient.listVotesOnchains).toHaveBeenCalledWith({
      daoId: 'ENS',
      proposalId_in: ['proposal-3', 'proposal-2', 'proposal-1'],
      voterAccountId_in: followedAddresses
    });
    
    // Should use batch method for getting wallet owners
    expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith([TestAddresses.ADDRESS_2, TestAddresses.ADDRESS_3]);
    
    // Validate notifications were sent for both non-voting addresses
    const notificationCalls = mockNotificationClient.sendNotification.mock.calls;
    expect(notificationCalls.length).toBeGreaterThanOrEqual(2);
    
    const sentAddresses = notificationCalls.map(call => call[0].metadata?.addresses?.nonVoterAddress);
    
    expect(sentAddresses).toContain(TestAddresses.ADDRESS_2);
    expect(sentAddresses).toContain(TestAddresses.ADDRESS_3);
    
    // Validate that messages have correct format
    notificationCalls.forEach(call => {
      const { userId, channel, channelUserId, message, metadata } = call[0];
      expect(userId).toBe('user-1');
      expect(channel).toBe('telegram');
      expect(channelUserId).toBe('12345');
      expect(message).toContain('Non-Voting Alert for DAO ENS');
      expect(message).toContain('hasn\'t voted in the last 3 proposals');
      expect(metadata?.addresses?.nonVoterAddress).toMatch(/^0x[a-fA-F0-9]{40,}$/);
    });
  });

  it('should not send notifications if address has voted in all proposals', async () => {
    const message = createDispatcherMessage([
      createProposalNotification()
    ]);

    const followedAddresses = [TestAddresses.ADDRESS_1];
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1')
    ];

    // User voted in all proposals
    const votes = [
      createVote(TestAddresses.ADDRESS_1, 'proposal-1'),
      createVote(TestAddresses.ADDRESS_1, 'proposal-2'),
      createVote(TestAddresses.ADDRESS_1, 'proposal-3')
    ];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(followedAddresses);
    mockAnticaptureClient.listVotesOnchains.mockResolvedValue(votes as any);

    await handler.handleMessage(message);

    // Should not attempt to send notifications
    expect(mockSubscriptionClient.getWalletOwners).not.toHaveBeenCalled();
    expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
  });

  it('should handle case with less than 3 proposals', async () => {
    const message = createDispatcherMessage([
      createProposalNotification({ id: 'proposal-2', daoId: 'NEW-DAO' })
    ]);

    // Only 2 proposals exist
    mockAnticaptureClient.listProposals.mockResolvedValue([
      createProposal('proposal-2', 'Proposal 2', 'NEW-DAO'),
      createProposal('proposal-1', 'Proposal 1', 'NEW-DAO')
    ] as any);

    await handler.handleMessage(message);

    // Should not continue processing
    expect(mockSubscriptionClient.getFollowedAddresses).not.toHaveBeenCalled();
    expect(mockAnticaptureClient.listVotesOnchains).not.toHaveBeenCalled();
  });

  it('should handle case with no followed addresses', async () => {
    const message = createDispatcherMessage([
      createProposalNotification({ daoId: 'EMPTY-DAO' })
    ]);

    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3', 'EMPTY-DAO'),
      createProposal('proposal-2', 'Proposal 2', 'EMPTY-DAO'),
      createProposal('proposal-1', 'Proposal 1', 'EMPTY-DAO')
    ];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue([]);

    await handler.handleMessage(message);

    // Should not continue processing votes
    expect(mockAnticaptureClient.listVotesOnchains).not.toHaveBeenCalled();
    expect(mockSubscriptionClient.getWalletOwners).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const message = createDispatcherMessage([
      createProposalNotification({ daoId: 'ERROR-DAO' })
    ]);

    // Simulate API error
    mockAnticaptureClient.listProposals.mockRejectedValue(new Error('API Error'));

    // Should not throw, but return gracefully
    const result = await handler.handleMessage(message);
    expect(result.messageId).toBe('proposal-finished');
    expect(mockSubscriptionClient.getFollowedAddresses).not.toHaveBeenCalled();
  });

  it('should format addresses correctly', async () => {
    const message = createDispatcherMessage([
      createProposalNotification()
    ]);

    const followedAddresses = [TestAddresses.ADDRESS_LONG];
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1')
    ];

    const votes: any[] = []; // No votes for the address
    const followers = [createUser()];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(followedAddresses);
    mockAnticaptureClient.listVotesOnchains.mockResolvedValue(votes);
    mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
      [TestAddresses.ADDRESS_LONG]: followers
    });
    mockSubscriptionClient.shouldSend.mockResolvedValue([
      createNotification('user-1', `${TestAddresses.ADDRESS_LONG}-non-voting-proposal-3`, 'ENS')
    ]);

    await handler.handleMessage(message);

    // Check that address is formatted correctly and full message is valid
    expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      channel: 'telegram',
      channelUserId: '12345',
      message: ExpectedMessages.createNonVotingAlert(TestAddresses.ADDRESS_LONG, '0x1234...7890', 'ENS'),
      metadata: {
        addresses: {
          'nonVoterAddress': TestAddresses.ADDRESS_LONG
        }
      }
    });
  });
});