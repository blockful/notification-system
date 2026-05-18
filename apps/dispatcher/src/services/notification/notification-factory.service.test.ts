import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationClientFactory } from './notification-factory.service';
import type {
  INotificationClient,
  NotificationPayload,
} from '../../interfaces/notification-client.interface';

class SimpleNotificationClient implements INotificationClient {
  public readonly sent: NotificationPayload[] = [];
  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.sent.push(payload);
  }
}

describe('NotificationClientFactory', () => {
  let factory: NotificationClientFactory;
  let client: SimpleNotificationClient;

  beforeEach(() => {
    factory = new NotificationClientFactory();
    client = new SimpleNotificationClient();
  });

  describe('getClient', () => {
    it('returns the registered client for a supported channel', () => {
      factory.addClient('telegram', client);
      expect(factory.getClient('telegram')).toBe(client);
    });

    it('throws for unsupported channel', () => {
      expect(() => factory.getClient('unsupported'))
        .toThrow("Notification client for channel 'unsupported' not found");
    });
  });

  describe('supportsChannel', () => {
    it('is true after addClient', () => {
      factory.addClient('telegram', client);
      expect(factory.supportsChannel('telegram')).toBe(true);
    });

    it('is false for unknown channels', () => {
      expect(factory.supportsChannel('unsupported')).toBe(false);
    });
  });
});
