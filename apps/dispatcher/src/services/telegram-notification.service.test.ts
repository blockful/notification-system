import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TelegramNotificationClient } from './notification/telegram-notification.service';
import { NotificationPayload, NotificationResponse } from '../interfaces/notification-client.interface';

describe('TelegramNotificationClient', () => {
  let client: TelegramNotificationClient;
  const baseUrl = 'https://api.telegram.example.com';
  
  beforeEach(() => {
    client = new TelegramNotificationClient(baseUrl);
    jest.resetAllMocks();
    // @ts-ignore - mocking fetch for tests
    global.fetch = jest.fn();
  });
  
  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const payload: NotificationPayload = {
        userId: 'user123',
        channel: 'telegram',
        channelUserId: '456',
        message: 'Test notification',
        metadata: { key: 'value' }
      };
      const expectedResponse: NotificationResponse = {
        id: 'notification-id',
        status: 'delivered',
        timestamp: '2023-08-15T12:30:45Z'
      };
      const mockResponse = {
        ok: true,
        json: jest.fn<() => Promise<NotificationResponse>>().mockResolvedValue(expectedResponse)
      };
      // @ts-ignore - mocking fetch response
      global.fetch.mockResolvedValue(mockResponse);
      await client.sendNotification(payload);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: payload.userId,
            channelUserId: 456,
            message: payload.message,
            metadata: payload.metadata,
          }),
        }
      );
    });
    
    it('should throw error when API request fails', async () => {
      const payload: NotificationPayload = {
        userId: 'user123',
        channel: 'telegram',
        channelUserId: '456',
        message: 'Test notification'
      };
      const mockErrorResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };
      // @ts-ignore - mocking fetch error response
      global.fetch.mockResolvedValue(mockErrorResponse);
      await expect(client.sendNotification(payload))
        .rejects
        .toThrow('Failed to send notification: Internal Server Error');
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/notifications`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String)
        })
      );
    });
  });
}); 