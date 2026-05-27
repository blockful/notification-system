/**
 * Tests for SlackBotService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SlackBotService } from './slack-bot.service';
import { SlackClientInterface, SlackMessage, SlackSendMessageOptions } from '../../interfaces/slack-client.interface';
import { IEnsResolver } from '../ens-resolver.service';
import { NotificationPayload } from '../../interfaces/notification.interface';

class SimpleSlackClient implements SlackClientInterface {
  public sent: Array<{ channel: string; text: string; options?: SlackSendMessageOptions }> = [];

  async sendMessage(channel: string, text: string, options?: SlackSendMessageOptions): Promise<SlackMessage> {
    this.sent.push({ channel, text, options });
    return { ts: '1234567890.123456', channel, text };
  }

  setupHandlers(): void {}
}

class SimpleEnsResolver implements IEnsResolver {
  private names = new Map<string, string>();

  setName(address: string, name: string): void {
    this.names.set(address, name);
  }

  async resolveDisplayName(address: string): Promise<string> {
    return this.names.get(address) ?? address;
  }

  async resolveToAddress(): Promise<string | null> {
    return null;
  }
}

describe('SlackBotService', () => {
  let slackBotService: SlackBotService;
  let slackClient: SimpleSlackClient;
  let ens: SimpleEnsResolver;

  beforeEach(() => {
    slackClient = new SimpleSlackClient();
    ens = new SimpleEnsResolver();
    slackBotService = new SlackBotService(slackClient, ens);
  });

  describe('sendNotification', () => {
    const basePayload: NotificationPayload = {
      userId: 'user123',
      channel: 'slack',
      channelUserId: 'T_WORKSPACE:U1234567890',
      message: 'Test notification message',
      bot_token: 'xoxb-test-workspace-token'
    };

    it('should send notification successfully', async () => {
      const result = await slackBotService.sendNotification(basePayload);

      expect(slackClient.sent).toHaveLength(1);
      expect(slackClient.sent[0]).toEqual({
        channel: 'U1234567890',
        text: 'Test notification message',
        options: {
          token: 'xoxb-test-workspace-token',
          mrkdwn: true,
          unfurl_links: false
        }
      });
      expect(result).toBe('1234567890.123456');
    });

    it('should process ENS address placeholders', async () => {
      ens.setName('0x742d35Cc6634C0532925a3b8D76be9D5B65F6a', 'alice.eth');
      ens.setName('0x456789abcdef', 'coolDAO.eth');

      await slackBotService.sendNotification({
        ...basePayload,
        message: 'Proposal by {{proposer}} in {{dao}}',
        metadata: {
          addresses: {
            proposer: '0x742d35Cc6634C0532925a3b8D76be9D5B65F6a',
            dao: '0x456789abcdef'
          }
        }
      });

      expect(slackClient.sent[0].text).toBe('Proposal by alice.eth in coolDAO.eth');
      expect(slackClient.sent[0].options?.token).toBe('xoxb-test-workspace-token');
    });
  });
});
