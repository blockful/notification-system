import { SlackDAOService } from './slack-dao.service';
import { SubscriptionAPIService } from './subscription-api.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';

describe('SlackDAOService - User ID Validation', () => {
  let slackDAOService: SlackDAOService;
  let subscriptionApiMock: jest.Mocked<SubscriptionAPIService>;
  let anticaptureClientMock: jest.Mocked<AnticaptureClient>;

  beforeEach(() => {
    // Create mocks
    subscriptionApiMock = {
      saveUserPreference: jest.fn(),
      getUserPreferences: jest.fn(),
      userExists: jest.fn(),
      getUserWallets: jest.fn(),
      addUserWallet: jest.fn(),
      removeUserWallet: jest.fn(),
    } as any;

    anticaptureClientMock = {
      getDAOs: jest.fn().mockResolvedValue([
        { id: 'UNI', name: 'Uniswap' },
        { id: 'ENS', name: 'ENS' },
      ]),
    } as any;

    slackDAOService = new SlackDAOService(anticaptureClientMock, subscriptionApiMock);
  });

  describe('User ID handling', () => {
    it('should handle alphanumeric Slack IDs correctly', async () => {
      const alphanumericIds = ['U024BE7LH', 'W012A3CDE', 'U9Z8Y7X6W'];

      for (const userId of alphanumericIds) {
        subscriptionApiMock.getUserPreferences.mockResolvedValue([]);

        const context: any = {
          body: { user_id: userId },
          session: { daoSelections: new Set() },
          ack: jest.fn(),
          respond: jest.fn(),
        };

        await slackDAOService.initialize(context, 'subscribe');

        // Verify getUserPreferences was called with the original string
        expect(subscriptionApiMock.getUserPreferences).toHaveBeenCalledWith(
          userId,
          'slack',
          expect.any(Array)
        );
      }
    });
  });
});

describe('SubscriptionAPIService - NaN Validation', () => {
  let subscriptionApi: SubscriptionAPIService;
  let axiosPostMock: jest.Mock;

  beforeEach(() => {
    subscriptionApi = new SubscriptionAPIService('http://test-api');

    // Mock the axios client
    axiosPostMock = jest.fn().mockResolvedValue({ data: {} });
    (subscriptionApi as any).client.post = axiosPostMock;
  });

  describe('saveUserPreference validation', () => {
    it('should accept valid Slack user IDs', async () => {
      const validIds = ['U024BE7LH', 'W012A3CDE', 'U9Z8Y7X6W'];

      for (const userId of validIds) {
        await subscriptionApi.saveUserPreference('UNI', userId, 'slack', true);

        expect(axiosPostMock).toHaveBeenCalledWith(
          '/subscriptions/UNI',
          expect.objectContaining({
            channel_user_id: userId,
          })
        );
      }
    });

    it('should accept valid Telegram user IDs', async () => {
      const telegramIds = [123456789, 987654321];

      for (const userId of telegramIds) {
        await subscriptionApi.saveUserPreference('UNI', userId, 'telegram', true);

        expect(axiosPostMock).toHaveBeenCalledWith(
          '/subscriptions/UNI',
          expect.objectContaining({
            channel_user_id: userId.toString(),
          })
        );
      }
    });
  });
});