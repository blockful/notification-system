/**
 * Tests for SlackClient implementation
 * Uses MSW to intercept Slack Web API calls instead of mocking the WebClient.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { SlackClient } from './slack.client';

const TEST_SIGNING_SECRET = 'test-signing-secret';
const TEST_API_PORT_SLACK = 3002;
const TEST_SUBSCRIPTION_SERVER_URL = 'http://test-subscription-server';
const TEST_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const TEST_TOKEN = 'xoxb-test-token';
const TEST_CHANNEL = 'C1234567890';
const TEST_TS = '1234567890.123456';

let lastPostMessageForm: Record<string, string> | null = null;

const server = setupServer(
  http.post('https://slack.com/api/chat.postMessage', async ({ request }) => {
    const body = await request.text();
    lastPostMessageForm = Object.fromEntries(new URLSearchParams(body));
    return HttpResponse.json({ ok: true, ts: TEST_TS, channel: TEST_CHANNEL });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  lastPostMessageForm = null;
});
afterAll(() => server.close());

function buildClient() {
  return new SlackClient(
    TEST_SIGNING_SECRET,
    TEST_SUBSCRIPTION_SERVER_URL,
    TEST_ENCRYPTION_KEY,
    TEST_API_PORT_SLACK,
  );
}

describe('SlackClient', () => {
  let slackClient: SlackClient;

  beforeEach(() => {
    slackClient = buildClient();
  });

  describe('constructor', () => {
    it('should create client with valid configuration', () => {
      expect(buildClient()).toBeInstanceOf(SlackClient);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const result = await slackClient.sendMessage(TEST_CHANNEL, 'Test message', { token: TEST_TOKEN });

      expect(lastPostMessageForm).toMatchObject({
        channel: TEST_CHANNEL,
        text: 'Test message',
        parse: 'none',
        link_names: 'true',
        unfurl_links: 'false',
        unfurl_media: 'false',
        mrkdwn: 'true',
      });

      expect(result).toEqual({
        ts: TEST_TS,
        channel: TEST_CHANNEL,
        text: 'Test message',
      });
    });

    it('should convert markdown links to Slack format', async () => {
      await slackClient.sendMessage(TEST_CHANNEL, 'Check [this link](https://example.com)', { token: TEST_TOKEN });

      expect(lastPostMessageForm?.text).toBe('Check <https://example.com|this link>');
    });

    it('should convert bold markdown to Slack format', async () => {
      await slackClient.sendMessage(TEST_CHANNEL, 'This is **bold** text', { token: TEST_TOKEN });

      expect(lastPostMessageForm?.text).toBe('This is *bold* text');
    });

    it('should use custom options when provided', async () => {
      await slackClient.sendMessage(TEST_CHANNEL, 'Test message', {
        token: TEST_TOKEN,
        parse: 'full',
        link_names: false,
        unfurl_links: true,
        unfurl_media: true,
        mrkdwn: false,
      });

      expect(lastPostMessageForm).toMatchObject({
        channel: TEST_CHANNEL,
        text: 'Test message',
        parse: 'full',
        link_names: 'false',
        unfurl_links: 'true',
        unfurl_media: 'true',
        mrkdwn: 'false',
      });
    });
  });
});
