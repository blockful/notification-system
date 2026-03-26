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
      shouldSendBatch: jest.fn(),
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
      getProposalNonVoters: jest.fn(),
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

  it('should notify when address did not vote in any of the last 3 proposals', async () => {
    const message = createDispatcherMessage([
      createProposalNotification({ id: 'proposal-3' })
    ]);

    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1')
    ];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue([TestAddresses.ADDRESS_1]);
    mockAnticaptureClient.getProposalNonVoters
      .mockResolvedValue([{ voter: TestAddresses.ADDRESS_1 }]);

    const followers = [createUser()];
    mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
      [TestAddresses.ADDRESS_1]: followers
    });
    mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(followers);
    mockSubscriptionClient.shouldSendBatch.mockResolvedValue([
      [createNotification('user-1', `${TestAddresses.ADDRESS_1}-non-voting-proposal-3`, 'ENS')]
    ]);

    await handler.handleMessage(message);

    expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith([TestAddresses.ADDRESS_1], 'non-voting');
    expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('ENS', undefined, 'non-voting');
    expect(mockNotificationClient.sendNotification).toHaveBeenCalled();

    const sentAddress = mockNotificationClient.sendNotification.mock.calls[0][0].metadata?.addresses?.nonVoterAddress;
    expect(sentAddress).toBe(TestAddresses.ADDRESS_1);
  });

  it('should NOT notify when address voted in at least one of the last 3 proposals', async () => {
    const message = createDispatcherMessage([
      createProposalNotification({ id: 'proposal-3' })
    ]);

    const followedAddresses = [TestAddresses.ADDRESS_1];
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1')
    ];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(followedAddresses);
    mockAnticaptureClient.getProposalNonVoters
      .mockResolvedValueOnce([{ voter: TestAddresses.ADDRESS_1 }]) // proposal-3
      .mockResolvedValueOnce([])                                   // proposal-2: voted!
      .mockResolvedValueOnce([{ voter: TestAddresses.ADDRESS_1 }]); // proposal-1

    await handler.handleMessage(message);

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
    expect(mockAnticaptureClient.getProposalNonVoters).not.toHaveBeenCalled();
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

    // Should not continue processing non-voters
    expect(mockAnticaptureClient.getProposalNonVoters).not.toHaveBeenCalled();
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

    const followers = [createUser()];

    mockAnticaptureClient.listProposals.mockResolvedValue(lastProposals as any);
    mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(followedAddresses);
    mockAnticaptureClient.getProposalNonVoters
      .mockResolvedValue([{ voter: TestAddresses.ADDRESS_LONG }]);
    mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
      [TestAddresses.ADDRESS_LONG]: followers
    });
    mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(followers);
    mockSubscriptionClient.shouldSendBatch.mockResolvedValue([
      [createNotification('user-1', `${TestAddresses.ADDRESS_LONG}-non-voting-proposal-3`, 'ENS')]
    ]);

    await handler.handleMessage(message);

    // Check that address is formatted correctly and full message is valid
    expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith({
      userId: 'user-1',
      channel: 'telegram',
      channelUserId: '12345',
      message: ExpectedMessages.createNonVotingAlert('ENS'),
      bot_token: undefined,
      metadata: {
        triggerType: 'nonVoting',
        addresses: {
          'nonVoterAddress': TestAddresses.ADDRESS_LONG
        },
        buttons: [
          {
            text: 'Check previous votes',
            url: `https://anticapture.com/ENS/holders-and-delegates?tab=delegates&drawerAddress=${TestAddresses.ADDRESS_LONG}`
          }
        ]
      }
    });
  });
});