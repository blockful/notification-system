/**
 * Tests for SlackBotService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SlackBotService } from './slack-bot.service';
import { SlackClientInterface } from '../../interfaces/slack-client.interface';
import { EnsResolverService } from '../ens-resolver.service';
import { NotificationPayload } from '../../interfaces/notification.interface';

describe('SlackBotService', () => {
  let slackBotService: SlackBotService;
  let mockSlackClient: jest.Mocked<SlackClientInterface>;
  let mockEnsResolver: jest.Mocked<EnsResolverService>;

  beforeEach(() => {
    mockSlackClient = {
      sendMessage: jest.fn(),
      setupHandlers: jest.fn()
    };

    mockEnsResolver = {
      resolveDisplayName: jest.fn()
    } as any;

    slackBotService = new SlackBotService(
      mockSlackClient,
      mockEnsResolver
    );
  });

  describe('sendNotification', () => {
    const mockPayload: NotificationPayload = {
      userId: 'user123',
      channel: 'slack',
      channelUserId: 'T_WORKSPACE:U1234567890',
      message: 'Test notification message',
      bot_token: 'xoxb-test-workspace-token'
    };

    beforeEach(() => {
      mockSlackClient.sendMessage.mockResolvedValue({
        ts: '1234567890.123456',
        channel: 'U1234567890',
        text: 'Test notification message'
      });
    });

    it('should send notification successfully', async () => {
      const result = await slackBotService.sendNotification(mockPayload);

      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        'U1234567890',
        'Test notification message',
        {
          token: 'xoxb-test-workspace-token',
          mrkdwn: true,
          unfurl_links: false
        }
      );

      expect(result).toBe('1234567890.123456');
    });

    it('should process ENS address placeholders', async () => {
      const payloadWithAddresses: NotificationPayload = {
        ...mockPayload,
        message: 'Proposal by {{proposer}} in {{dao}}',
        bot_token: 'xoxb-test-workspace-token',
        metadata: {
          addresses: {
            proposer: '0x742d35Cc6634C0532925a3b8D76be9D5B65F6a',
            dao: '0x456789abcdef'
          }
        }
      };

      mockEnsResolver.resolveDisplayName
        .mockResolvedValueOnce('alice.eth')
        .mockResolvedValueOnce('coolDAO.eth');

      await slackBotService.sendNotification(payloadWithAddresses);

      expect(mockEnsResolver.resolveDisplayName).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b8D76be9D5B65F6a');
      expect(mockEnsResolver.resolveDisplayName).toHaveBeenCalledWith('0x456789abcdef');

      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        'U1234567890',
        'Proposal by alice.eth in coolDAO.eth',
        {
          token: 'xoxb-test-workspace-token',
          mrkdwn: true,
          unfurl_links: false
        }
      );
    });
  });
});