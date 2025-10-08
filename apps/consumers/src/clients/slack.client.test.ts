/**
 * Tests for SlackClient implementation
 * Tests both Web API and Bolt framework integration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SlackClient } from './slack.client';
import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';

jest.mock('@slack/web-api');
jest.mock('@slack/bolt');

// Test configuration constants
const TEST_APP_TOKEN = 'xapp-test-app-token';
const TEST_SIGNING_SECRET = 'test-signing-secret';
const TEST_SUBSCRIPTION_SERVER_URL = 'http://test-subscription-server';
const TEST_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('SlackClient', () => {
  let slackClient: SlackClient;
  let mockWebClient: jest.Mocked<WebClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebClient = new WebClient() as jest.Mocked<WebClient>;
    (WebClient as unknown as jest.Mock).mockImplementation(() => mockWebClient);

    slackClient = new SlackClient(
      TEST_APP_TOKEN,
      TEST_SIGNING_SECRET,
      TEST_SUBSCRIPTION_SERVER_URL,
      TEST_ENCRYPTION_KEY
    );
  });

  describe('constructor', () => {
    it('should create client with valid token', () => {
      expect(new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      )).toBeInstanceOf(SlackClient);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      (mockWebClient.chat as any) = {
        postMessage: jest.fn()
      } as any;
    });

    it('should send message successfully', async () => {
      const mockResponse = {
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890',
      };

      (mockWebClient.chat.postMessage as jest.Mock).mockResolvedValue(mockResponse as never);

      const result = await slackClient.sendMessage('C1234567890', 'Test message', { token: 'xoxb-test-token' });

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        text: 'Test message',
        parse: 'none',
        link_names: true,
        unfurl_links: false,
        unfurl_media: false,
        mrkdwn: true
      });

      expect(result).toEqual({
        ts: '1234567890.123456',
        channel: 'C1234567890',
        text: 'Test message'
      });
    });

    it('should convert markdown links to Slack format', async () => {
      const mockResponse = {
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890',
      };

      (mockWebClient.chat.postMessage as jest.Mock).mockResolvedValue(mockResponse as never);

      await slackClient.sendMessage('C1234567890', 'Check [this link](https://example.com)', { token: 'xoxb-test-token' });

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        text: 'Check <https://example.com|this link>',
        parse: 'none',
        link_names: true,
        unfurl_links: false,
        unfurl_media: false,
        mrkdwn: true
      });
    });

    it('should convert bold markdown to Slack format', async () => {
      const mockResponse = {
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890',
      };

      (mockWebClient.chat.postMessage as jest.Mock).mockResolvedValue(mockResponse as never);

      await slackClient.sendMessage('C1234567890', 'This is **bold** text', { token: 'xoxb-test-token' });

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        text: 'This is *bold* text',
        parse: 'none',
        link_names: true,
        unfurl_links: false,
        unfurl_media: false,
        mrkdwn: true
      });
    });

    it('should use custom options when provided', async () => {
      const mockResponse = {
        ok: true,
        ts: '1234567890.123456',
        channel: 'C1234567890',
      };

      (mockWebClient.chat.postMessage as jest.Mock).mockResolvedValue(mockResponse as never);

      await slackClient.sendMessage('C1234567890', 'Test message', {
        token: 'xoxb-test-token',
        parse: 'full',
        link_names: false,
        unfurl_links: true,
        unfurl_media: true,
        mrkdwn: false
      });

      expect(mockWebClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C1234567890',
        text: 'Test message',
        parse: 'full',
        link_names: false,
        unfurl_links: true,
        unfurl_media: true,
        mrkdwn: false
      });
    });
  });

  describe('Socket Mode', () => {
    let mockBoltApp: jest.Mocked<App>;

    beforeEach(() => {
      jest.clearAllMocks();
      mockBoltApp = {
        command: jest.fn(),
        action: jest.fn(),
        view: jest.fn(),
        message: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined as never),
        stop: jest.fn()
      } as any;

      (App as unknown as jest.Mock).mockImplementation(() => mockBoltApp);
    });

    it('should always initialize with Socket Mode', () => {
      const client = new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      );

      expect(App).toHaveBeenCalledWith({
        appToken: TEST_APP_TOKEN,
        signingSecret: TEST_SIGNING_SECRET,
        socketMode: true,
        processBeforeResponse: true,
        installationStore: expect.objectContaining({
          storeInstallation: expect.any(Function),
          fetchInstallation: expect.any(Function),
          deleteInstallation: expect.any(Function)
        }),
        authorize: expect.any(Function)
      });
    });


    it('should setup command handlers', () => {
      const client = new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      );

      client.setupHandlers?.((handlers) => {
        handlers.command('/test', async (ctx) => {
          await ctx.ack();
        });
      });

      expect(mockBoltApp.command).toHaveBeenCalledWith('/test', expect.any(Function));
    });

    it('should setup action handlers', () => {
      const client = new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      );

      client.setupHandlers?.((handlers) => {
        handlers.action('button_click', async (ctx) => {
          await ctx.ack();
        });
      });

      expect(mockBoltApp.action).toHaveBeenCalledWith('button_click', expect.any(Function));
    });

    it('should launch the Bolt app', async () => {
      const client = new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      );

      await client.launch?.();

      expect(mockBoltApp.start).toHaveBeenCalled();
    });

    it('should stop the Bolt app', () => {
      const client = new SlackClient(
        TEST_APP_TOKEN,
        TEST_SIGNING_SECRET,
        TEST_SUBSCRIPTION_SERVER_URL,
        TEST_ENCRYPTION_KEY
      );

      client.stop?.('SIGTERM');

      expect(mockBoltApp.stop).toHaveBeenCalled();
    });
  });
});