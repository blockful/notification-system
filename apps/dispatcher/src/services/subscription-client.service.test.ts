import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import axios from 'axios';
import { SubscriptionClient } from './subscription-client.service';
import { User, Notification } from '../interfaces/subscription-client.interface';

const TEST_BASE_URL = 'http://subscription-server.test';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SubscriptionClient', () => {
  const client = new SubscriptionClient(axios.create({ baseURL: TEST_BASE_URL }));

  describe('getDaoSubscribers', () => {
    it('should fetch subscribers for a DAO successfully', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() },
        { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() },
      ];
      let capturedUrl: URL | undefined;

      server.use(
        http.get(`${TEST_BASE_URL}/subscriptions/dao123`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json(mockUsers);
        }),
      );

      const result = await client.getDaoSubscribers('dao123');

      expect(capturedUrl?.pathname).toBe('/subscriptions/dao123');
      expect(capturedUrl?.search).toBe('');
      expect(result).toEqual(
        mockUsers.map(user => ({ ...user, created_at: user.created_at.toISOString() })),
      );
    });

    it('should throw error when API request fails', async () => {
      server.use(
        http.get(`${TEST_BASE_URL}/subscriptions/dao123`, () =>
          HttpResponse.json({ error: 'boom' }, { status: 500 }),
        ),
      );

      await expect(client.getDaoSubscribers('dao123')).rejects.toThrow();
    });
  });

  describe('shouldSend', () => {
    it('should filter subscribers correctly', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() },
      ];
      const mockNotifications: Notification[] = [
        { user_id: '1', event_id: 'prop123', dao_id: 'dao123' },
      ];
      let capturedBody: { notifications: Notification[] } | undefined;

      server.use(
        http.post<never, { notifications: Notification[] }>(
          `${TEST_BASE_URL}/notifications/exclude-sent`,
          async ({ request }) => {
            capturedBody = await request.json();
            return HttpResponse.json(mockNotifications);
          },
        ),
      );

      const result = await client.shouldSend(mockUsers, 'prop123', 'dao123');

      expect(capturedBody).toEqual({
        notifications: [{ user_id: '1', event_id: 'prop123', dao_id: 'dao123' }],
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsSent', () => {
    it('should mark notifications as sent successfully', async () => {
      const mockNotifications: Notification[] = [
        { user_id: '1', event_id: 'prop123', dao_id: 'dao123' },
      ];
      let capturedBody: { notifications: Notification[] } | undefined;

      server.use(
        http.post<never, { notifications: Notification[] }>(
          `${TEST_BASE_URL}/notifications/mark-sent`,
          async ({ request }) => {
            capturedBody = await request.json();
            return HttpResponse.json({ success: true });
          },
        ),
      );

      await client.markAsSent(mockNotifications);

      expect(capturedBody).toEqual({ notifications: mockNotifications });
    });
  });
});
