import { SlackDAOService } from './slack-dao.service';
import { SubscriptionAPIService } from '../subscription-api.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';

describe('SlackDAOService - User ID Validation', () => {
  let slackDAOService: SlackDAOService;
  let subscriptionApiMock: jest.Mocked<SubscriptionAPIService>;
  let anticaptureClientMock: jest.Mocked<AnticaptureClient>;
  let subscriptionApi: SubscriptionAPIService;
  let axiosPostMock: jest.Mock;
  
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
    subscriptionApi = new SubscriptionAPIService('http://test-api');
    axiosPostMock = jest.fn().mockResolvedValue({ data: {} });
    (subscriptionApi as any).client.post = axiosPostMock;
    slackDAOService = new SlackDAOService(anticaptureClientMock, subscriptionApiMock);
  });

  describe('User ID handling', () => {
    it('should handle alphanumeric Slack IDs correctly', async () => {
      const alphanumericIds = ['U024BE7LH', 'W012A3CDE', 'U9Z8Y7X6W'];

      for (const userId of alphanumericIds) {
        subscriptionApiMock.getUserPreferences.mockResolvedValue([]);

        const context: any = {
          body: { user_id: userId, team_id: 'T_WORKSPACE' },
          session: { daoSelections: new Set() },
          ack: jest.fn(),
          respond: jest.fn(),
        };

        await slackDAOService.initialize(context, 'subscribe');

        // Verify getUserPreferences was called with the workspace:user format
        expect(subscriptionApiMock.getUserPreferences).toHaveBeenCalledWith(
          `T_WORKSPACE:${userId}`,
          'slack',
          expect.any(Array)
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
