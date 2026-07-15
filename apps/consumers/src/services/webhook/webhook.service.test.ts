import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookService } from './webhook.service';
import { ISubscriptionAPI } from '../subscription-api.service';
import { UserSubscriptionResponse } from '../../interfaces/subscription.interface';
import { makeAnticaptureClient } from '@notification-system/anticapture-client';

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
});
