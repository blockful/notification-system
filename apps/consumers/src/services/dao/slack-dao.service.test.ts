import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { SlackDAOService } from './slack-dao.service';
import { ISubscriptionAPI, SubscriptionAPIService, UserSubscriptionResponse } from '../subscription-api.service';
import type { DAOSource } from './base-dao.service';
import type { SlackDAORequest } from './slack-dao.service';

const TEST_API_URL = 'http://test-api';

class SimpleAnticaptureClient implements DAOSource {
  async getDAOs() {
    return [
      { id: 'UNI', chainId: 1, blockTime: 12, votingDelay: '0', alreadySupportCalldataReview: false, supportOffchainData: false },
      { id: 'ENS', chainId: 1, blockTime: 12, votingDelay: '0', alreadySupportCalldataReview: false, supportOffchainData: false },
    ];
  }
}

class SimpleSubscriptionAPI implements ISubscriptionAPI {
  public getUserPreferencesCalls: Array<{ channelUserId: string | number; channel: string; availableDAOs: string[] }> = [];

  async getUserPreferences(channelUserId: string | number, channel: string, availableDAOs: string[]): Promise<string[]> {
    this.getUserPreferencesCalls.push({ channelUserId, channel, availableDAOs });
    return [];
  }

  async saveUserPreference(): Promise<UserSubscriptionResponse> {
    return {} as UserSubscriptionResponse;
  }
}

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SlackDAOService - User ID Validation', () => {
  let slackDAOService: SlackDAOService;
  let subscriptionApi: SimpleSubscriptionAPI;

  beforeEach(() => {
    subscriptionApi = new SimpleSubscriptionAPI();
    slackDAOService = new SlackDAOService(new SimpleAnticaptureClient(), subscriptionApi);
  });

  describe('User ID handling', () => {
    it('should handle alphanumeric Slack IDs correctly', async () => {
      const alphanumericIds = ['U024BE7LH', 'W012A3CDE', 'U9Z8Y7X6W'];

      for (const channelId of alphanumericIds) {
        const context: SlackDAORequest = {
          body: { channel_id: channelId, team_id: 'T_WORKSPACE' },
          session: { daoSelections: new Set<string>() },
          ack: vi.fn(),
          respond: vi.fn(),
        };

        await slackDAOService.initialize(context);
      }

      expect(subscriptionApi.getUserPreferencesCalls.map(c => c.channelUserId)).toEqual([
        'T_WORKSPACE:U024BE7LH',
        'T_WORKSPACE:W012A3CDE',
        'T_WORKSPACE:U9Z8Y7X6W',
      ]);
      expect(subscriptionApi.getUserPreferencesCalls.every(c => c.channel === 'slack')).toBe(true);
    });

    it('should serialize numeric Telegram user IDs as strings in API calls', async () => {
      const captured: unknown[] = [];
      server.use(
        http.post(`${TEST_API_URL}/subscriptions/UNI`, async ({ request }) => {
          captured.push(await request.json());
          return HttpResponse.json({});
        }),
      );

      const realApi = new SubscriptionAPIService(TEST_API_URL);

      for (const userId of [123456789, 987654321]) {
        await realApi.saveUserPreference('UNI', userId, 'telegram', true);
      }

      expect(captured).toEqual([
        { channel: 'telegram', channel_user_id: '123456789', is_active: true },
        { channel: 'telegram', channel_user_id: '987654321', is_active: true },
      ]);
    });
  });
});
