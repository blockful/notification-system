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
    it('should pass Slack user IDs as strings without conversion', async () => {
      const slackUserId = 'U024BE7LH';
      const selectedDAOs = new Set(['UNI']);

      // Call the private method through reflection or make it public for testing
      // For now, we'll test through the public interface
      subscriptionApiMock.saveUserPreference.mockResolvedValue({
        user: { id: '123', channel: 'slack', channel_user_id: slackUserId },
        result: { id: '456', user_id: '123', dao_id: 'UNI', is_active: true }
      });

      // Test the updateSubscriptions method indirectly through confirm
      const context: any = {
        body: { user: { id: slackUserId } },
        session: { daoSelections: selectedDAOs },
        ack: jest.fn(),
        respond: jest.fn(),
      };

      await slackDAOService.confirm(context, 'subscribe');

      // Verify that saveUserPreference was called with string ID, not Number
      expect(subscriptionApiMock.saveUserPreference).toHaveBeenCalledWith(
        'UNI',
        slackUserId, // Should be string, not number
        'slack',
        true
      );
    });

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

    it('should handle NaN values by converting to "NaN" string', async () => {
      const nanValue = NaN;

      await subscriptionApi.saveUserPreference('UNI', nanValue as any, 'slack', true);

      expect(axiosPostMock).toHaveBeenCalledWith(
        '/subscriptions/UNI',
        expect.objectContaining({
          channel_user_id: 'NaN',
        })
      );
    });

    it('should accept "NaN" as a valid string', async () => {
      await subscriptionApi.saveUserPreference('UNI', 'NaN', 'slack', true);

      expect(axiosPostMock).toHaveBeenCalledWith(
        '/subscriptions/UNI',
        expect.objectContaining({
          channel_user_id: 'NaN',
        })
      );
    });

  });

  describe('getUserPreferences validation', () => {
    it('should handle NaN values by converting to "NaN" string', async () => {
      const nanValue = Number('U024BE7LH'); // This creates NaN
      const axiosGetMock = jest.fn().mockResolvedValue({ data: [] });
      (subscriptionApi as any).client.get = axiosGetMock;

      const result = await subscriptionApi.getUserPreferences(nanValue, 'slack', ['UNI']);

      expect(result).toEqual([]);
      expect(axiosGetMock).toHaveBeenCalled();
    });

    it('should accept valid string IDs', async () => {
      const axiosGetMock = jest.fn().mockResolvedValue({ data: [] });
      (subscriptionApi as any).client.get = axiosGetMock;

      const result = await subscriptionApi.getUserPreferences('U024BE7LH', 'slack', ['UNI']);

      expect(result).toEqual([]);
      expect(axiosGetMock).toHaveBeenCalled();
    });
  });
});