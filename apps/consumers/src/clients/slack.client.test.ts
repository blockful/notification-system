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

describe('SlackClient', () => {
  let slackClient: SlackClient;
  let mockWebClient: jest.Mocked<WebClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebClient = new WebClient() as jest.Mocked<WebClient>;
    (WebClient as unknown as jest.Mock).mockImplementation(() => mockWebClient);

    slackClient = new SlackClient('test-app-token', 'test-signing-secret');
  });

  describe('constructor', () => {
    it('should create client with valid token', () => {
      expect(new SlackClient('valid-app-token', 'valid-signing-secret')).toBeInstanceOf(SlackClient);
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
      const client = new SlackClient('xapp-token', 'signing-secret');

      expect(App).toHaveBeenCalledWith({
        appToken: 'xapp-token',
        signingSecret: 'signing-secret',
        socketMode: true,
        processBeforeResponse: true,
        authorize: expect.any(Function)
      });
    });


    it('should setup command handlers', () => {
      const client = new SlackClient('xapp-token', 'signing-secret');

      client.setupHandlers?.((handlers) => {
        handlers.command('/test', async (ctx) => {
          await ctx.ack();
        });
      });

      expect(mockBoltApp.command).toHaveBeenCalledWith('/test', expect.any(Function));
    });

    it('should setup action handlers', () => {
      const client = new SlackClient('xapp-token', 'signing-secret');

      client.setupHandlers?.((handlers) => {
        handlers.action('button_click', async (ctx) => {
          await ctx.ack();
        });
      });

      expect(mockBoltApp.action).toHaveBeenCalledWith('button_click', expect.any(Function));
    });

    it('should launch the Bolt app', async () => {
      const client = new SlackClient('xapp-token', 'signing-secret');

      await client.launch?.();

      expect(mockBoltApp.start).toHaveBeenCalled();
    });

    it('should stop the Bolt app', () => {
      const client = new SlackClient('xapp-token', 'signing-secret');

      client.stop?.('SIGTERM');

      expect(mockBoltApp.stop).toHaveBeenCalled();
    });
  });
});