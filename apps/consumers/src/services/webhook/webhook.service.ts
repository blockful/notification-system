import axios, { AxiosInstance } from 'axios';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';
import { SubscriptionAPIService } from '../subscription-api.service';
import { createLogger, type Logger } from '@anticapture/observability';

export class WebhookService implements BotServiceInterface {
  private httpClient: AxiosInstance;
  private readonly logger: Logger;

  constructor(
    private anticaptureClient: AnticaptureClient,
    private subscriptionApi: SubscriptionAPIService,
    logger: Logger = createLogger('consumers'),
  ) {
    this.httpClient = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.logger = logger.child({ component: 'WebhookService' });
  }

  async sendNotification(payload: NotificationPayload): Promise<string> {
    const url = payload.channelUserId.toString();

    const metadata: Record<string, any> = {
      channel: payload.channel,
      userId: payload.userId,
      ...payload.metadata,
    };

    const body = {
      event: metadata.triggerType || 'notification',
      message: payload.message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const response = await this.httpClient.post(url, body);
    const responseId = response.data?.id || response.data?.messageId || `webhook-${Date.now()}`;

    this.logger.info(
      { url, userId: payload.userId, responseId, event: 'webhook.delivered' },
      'notification delivered',
    );
    return responseId;
  }

  /**
   * Register a webhook URL by subscribing it to all available DAOs.
   * For each DAO, calls saveUserPreference which creates the user + preference
   * (or reactivates if already exists).
   */
  async registerWebhook(url: string): Promise<void> {
    const daos = await this.anticaptureClient.getDAOs();
    if (daos.length === 0) {
      throw new Error('No DAOs available to subscribe to');
    }

    for (const dao of daos) {
      await this.subscriptionApi.saveUserPreference(dao.id, url, 'webhook', true);
    }
  }

  /**
   * Deactivate a webhook by setting all its DAO subscriptions to inactive.
   * Returns false if the webhook has no existing subscriptions (not found).
   */
  async deactivateWebhook(url: string): Promise<boolean> {
    const daos = await this.anticaptureClient.getDAOs();
    const daoIds = daos.map((d) => d.id);

    const subscribed = await this.subscriptionApi.getUserPreferences(url, 'webhook', daoIds);
    if (subscribed.length === 0) {
      return false;
    }

    for (const dao of daos) {
      await this.subscriptionApi.saveUserPreference(dao.id, url, 'webhook', false);
    }

    return true;
  }
}
