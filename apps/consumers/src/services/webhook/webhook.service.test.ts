import { describe, it, expect, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import { AxiosInstance } from 'axios';
import { WebhookService } from './webhook.service';
import { ISubscriptionAPI } from '../subscription-api.service';
import { UserSubscriptionResponse } from '../../interfaces/subscription.interface';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { makeAnticaptureClient } from '@notification-system/anticapture-client';

class SimpleHttpClient {
  public posts: Array<{ url: string; data: any; config: any }> = [];

  post = async (url: string, data: any, config?: any) => {
    this.posts.push({ url, data, config });
    return { data: { id: 'delivered-1' } };
  };
}

const anticaptureClient = makeAnticaptureClient({
  getDAOs: async () => [
    { id: 'UNI', chainId: 1, blockTime: 12, votingDelay: '0', supportsCalldataReview: false, supportsOffchainData: false },
    { id: 'ENS', chainId: 1, blockTime: 12, votingDelay: '0', supportsCalldataReview: false, supportsOffchainData: false },
  ],
});

class SimpleSubscriptionAPI implements ISubscriptionAPI {
  constructor(private readonly responses: UserSubscriptionResponse[]) {}

  private callIndex = 0;

  async saveUserPreference(): Promise<UserSubscriptionResponse> {
    const response = this.responses[this.callIndex] ?? {};
    this.callIndex += 1;
    return response as UserSubscriptionResponse;
  }

  async getUserPreferences(): Promise<string[]> {
    return [];
  }
}

describe('WebhookService', () => {
  describe('registerWebhook', () => {
    it('returns created: true with the secret when one call carries a secret', async () => {
      const subscriptionApi = new SimpleSubscriptionAPI([
        { user_id: '1', dao_id: 'UNI', is_active: true, secret: 'super-secret' },
        { user_id: '1', dao_id: 'ENS', is_active: true },
      ]);
      const webhookService = new WebhookService(anticaptureClient, subscriptionApi);

      const result = await webhookService.registerWebhook('https://example.com/webhook');

      expect(result).toEqual({ created: true, secret: 'super-secret' });
    });

    it('returns created: false when no call carries a secret', async () => {
      const subscriptionApi = new SimpleSubscriptionAPI([
        { user_id: '1', dao_id: 'UNI', is_active: true },
        { user_id: '1', dao_id: 'ENS', is_active: true },
      ]);
      const webhookService = new WebhookService(anticaptureClient, subscriptionApi);

      const result = await webhookService.registerWebhook('https://example.com/webhook');

      expect(result).toEqual({ created: false });
    });
  });

  describe('sendNotification', () => {
    const subscriptionApi = new SimpleSubscriptionAPI([]);

    const basePayload: NotificationPayload = {
      userId: 'user123',
      channel: 'webhook',
      channelUserId: 'https://example.com/webhook',
      message: 'Test notification message',
      bot_token: 'shared-webhook-secret',
    };

    it('signs the delivery with an HMAC computed from the subscriber secret', async () => {
      const httpClient = new SimpleHttpClient();
      const webhookService = new WebhookService(
        anticaptureClient,
        subscriptionApi,
        undefined,
        httpClient as unknown as AxiosInstance,
      );

      const before = Math.floor(Date.now() / 1000);
      await webhookService.sendNotification(basePayload);
      const after = Math.floor(Date.now() / 1000);

      expect(httpClient.posts).toHaveLength(1);
      const [{ url, data: rawBody, config }] = httpClient.posts;

      expect(url).toBe('https://example.com/webhook');
      expect(typeof rawBody).toBe('string');

      const timestamp = Number(config.headers['X-Webhook-Timestamp']);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);

      const expectedSignature = crypto
        .createHmac('sha256', basePayload.bot_token!)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      expect(config.headers['X-Webhook-Signature']).toBe(`sha256=${expectedSignature}`);
    });

    it('skips delivery and does not POST when the subscriber has no bot_token/secret', async () => {
      const httpClient = new SimpleHttpClient();
      const webhookService = new WebhookService(
        anticaptureClient,
        subscriptionApi,
        undefined,
        httpClient as unknown as AxiosInstance,
      );

      const result = await webhookService.sendNotification({
        ...basePayload,
        bot_token: undefined,
      });

      expect(httpClient.posts).toHaveLength(0);
      expect(result).toBe('');
    });
  });
});
