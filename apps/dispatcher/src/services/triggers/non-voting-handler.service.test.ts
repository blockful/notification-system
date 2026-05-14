import { describe, it, expect, beforeEach } from 'vitest';
import { NonVotingHandler } from './non-voting-handler.service';
import { NotificationTypeId } from '@notification-system/messages';
import { IAnticaptureClient, OnchainProposal, Voter } from '@notification-system/anticapture-client';
import {
  SimpleSubscriptionClient,
  SimpleNotificationClientFactory,
  makeAnticaptureClient,
} from './helpers/test-doubles';
import {
  createProposalNotification,
  createDispatcherMessage,
  createProposal,
  createUser,
  TestAddresses,
  ExpectedMessages,
} from './non-voting-handler.test-factory';

describe('NonVotingHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationFactory: SimpleNotificationClientFactory;
  let handler: NonVotingHandler;

  function makeNonVotingSource(opts: {
    proposals?: ReturnType<typeof createProposal>[];
    nonVotersByProposal?: Map<string, { voter: string }[]>;
    listProposalsThrows?: boolean;
  }): IAnticaptureClient {
    return makeAnticaptureClient({
      listProposals: async () => {
        if (opts.listProposalsThrows) throw new Error('API Error');
        // Stub returns the subset of fields the handler reads — cast to satisfy IAnticaptureClient
        return (opts.proposals ?? []).map(p => ({
          id: p.id,
          endTimestamp: p.endTimestamp,
          title: p.title,
          description: p.description,
        })) as unknown as OnchainProposal[];
      },
      getProposalNonVoters: async (proposalId: string) => {
        return (opts.nonVotersByProposal?.get(proposalId) ?? []) as unknown as Voter[];
      },
    });
  }

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationFactory = new SimpleNotificationClientFactory();
  });

  it('should notify when address did not vote in any of the last 3 proposals', async () => {
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1'),
    ];
    const nonVotersByProposal = new Map([
      ['proposal-3', [{ voter: TestAddresses.ADDRESS_1 }]],
      ['proposal-2', [{ voter: TestAddresses.ADDRESS_1 }]],
      ['proposal-1', [{ voter: TestAddresses.ADDRESS_1 }]],
    ]);
    const followers = [createUser()];
    subscriptionClient.followedAddressesByDao.set('ENS', [TestAddresses.ADDRESS_1]);
    subscriptionClient.walletOwnersByAddress.set(TestAddresses.ADDRESS_1, followers);
    subscriptionClient.daoSubscribersByDao.set('ENS', followers);
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ proposals: lastProposals, nonVotersByProposal }),
    );

    await handler.handleMessage(
      createDispatcherMessage([createProposalNotification({ id: 'proposal-3' })]),
    );

    expect(notificationFactory.client.sentPayloads).toHaveLength(1);
    expect(notificationFactory.client.sentPayloads[0].metadata?.addresses?.nonVoterAddress).toBe(
      TestAddresses.ADDRESS_1,
    );
    expect(subscriptionClient.markedAsSent).toEqual([
      {
        user_id: 'user-1',
        event_id: `${TestAddresses.ADDRESS_1}-non-voting-proposal-3`,
        dao_id: 'ENS',
      },
    ]);
  });

  it('should NOT notify when address voted in at least one of the last 3 proposals', async () => {
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1'),
    ];
    const nonVotersByProposal = new Map([
      ['proposal-3', [{ voter: TestAddresses.ADDRESS_1 }]],
      ['proposal-2', []],
      ['proposal-1', [{ voter: TestAddresses.ADDRESS_1 }]],
    ]);
    subscriptionClient.followedAddressesByDao.set('ENS', [TestAddresses.ADDRESS_1]);
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ proposals: lastProposals, nonVotersByProposal }),
    );

    await handler.handleMessage(
      createDispatcherMessage([createProposalNotification({ id: 'proposal-3' })]),
    );

    expect(notificationFactory.client.sentPayloads).toEqual([]);
    expect(subscriptionClient.markedAsSent).toEqual([]);
  });

  it('should not process when fewer than 3 proposals exist', async () => {
    const lastProposals = [
      createProposal('proposal-2', 'Proposal 2', 'NEW-DAO'),
      createProposal('proposal-1', 'Proposal 1', 'NEW-DAO'),
    ];
    subscriptionClient.followedAddressesByDao.set('NEW-DAO', [TestAddresses.ADDRESS_1]);
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ proposals: lastProposals }),
    );

    await handler.handleMessage(
      createDispatcherMessage([createProposalNotification({ id: 'proposal-2', daoId: 'NEW-DAO' })]),
    );

    expect(notificationFactory.client.sentPayloads).toEqual([]);
  });

  it('should not process when there are no followed addresses', async () => {
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3', 'EMPTY-DAO'),
      createProposal('proposal-2', 'Proposal 2', 'EMPTY-DAO'),
      createProposal('proposal-1', 'Proposal 1', 'EMPTY-DAO'),
    ];
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ proposals: lastProposals }),
    );

    await handler.handleMessage(
      createDispatcherMessage([createProposalNotification({ daoId: 'EMPTY-DAO' })]),
    );

    expect(notificationFactory.client.sentPayloads).toEqual([]);
  });

  it('should return result and not throw when listProposals fails', async () => {
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ listProposalsThrows: true }),
    );

    const result = await handler.handleMessage(
      createDispatcherMessage([createProposalNotification({ daoId: 'ERROR-DAO' })]),
    );

    expect(result).toEqual({
      messageId: NotificationTypeId.ProposalFinished,
      timestamp: expect.any(String),
    });
    expect(notificationFactory.client.sentPayloads).toEqual([]);
  });

  it('should send full notification payload with formatted address metadata and CTA button', async () => {
    const lastProposals = [
      createProposal('proposal-3', 'Proposal 3'),
      createProposal('proposal-2', 'Proposal 2'),
      createProposal('proposal-1', 'Proposal 1'),
    ];
    const nonVotersByProposal = new Map([
      ['proposal-3', [{ voter: TestAddresses.ADDRESS_LONG }]],
      ['proposal-2', [{ voter: TestAddresses.ADDRESS_LONG }]],
      ['proposal-1', [{ voter: TestAddresses.ADDRESS_LONG }]],
    ]);
    const followers = [createUser()];
    subscriptionClient.followedAddressesByDao.set('ENS', [TestAddresses.ADDRESS_LONG]);
    subscriptionClient.walletOwnersByAddress.set(TestAddresses.ADDRESS_LONG, followers);
    subscriptionClient.daoSubscribersByDao.set('ENS', followers);
    handler = new NonVotingHandler(
      subscriptionClient,
      notificationFactory,
      makeNonVotingSource({ proposals: lastProposals, nonVotersByProposal }),
    );

    await handler.handleMessage(createDispatcherMessage([createProposalNotification()]));

    expect(notificationFactory.client.sentPayloads).toEqual([
      {
        userId: 'user-1',
        channel: 'telegram',
        channelUserId: '12345',
        message: ExpectedMessages.createNonVotingAlert('ENS'),
        bot_token: undefined,
        metadata: {
          triggerType: 'nonVoting',
          addresses: {
            nonVoterAddress: TestAddresses.ADDRESS_LONG,
          },
          buttons: [
            {
              text: 'Check previous votes',
              url: `https://anticapture.com/ENS/holders-and-delegates?tab=delegates&drawerAddress=${TestAddresses.ADDRESS_LONG}`,
            },
          ],
        },
      },
    ]);
  });
});
