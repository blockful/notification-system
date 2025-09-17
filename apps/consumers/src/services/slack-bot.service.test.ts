/**
 * Tests for SlackBotService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SlackBotService } from './slack-bot.service';
import { SlackClientInterface } from '../interfaces/slack-client.interface';
import { ExplorerService } from './explorer.service';
import { EnsResolverService } from './ens-resolver.service';
import { NotificationPayload } from '../interfaces/notification.interface';

describe('SlackBotService', () => {
  let slackBotService: SlackBotService;
  let mockSlackClient: jest.Mocked<SlackClientInterface>;
  let mockExplorerService: jest.Mocked<ExplorerService>;
  let mockEnsResolver: jest.Mocked<EnsResolverService>;

  beforeEach(() => {
    mockSlackClient = {
      sendMessage: jest.fn(),
      setupHandlers: jest.fn()
    };

    mockExplorerService = {
      getTransactionLink: jest.fn()
    } as any;

    mockEnsResolver = {
      resolveDisplayName: jest.fn()
    } as any;

    slackBotService = new SlackBotService(
      mockSlackClient,
      mockExplorerService,
      mockEnsResolver
    );
  });

  describe('sendNotification', () => {
    const mockPayload: NotificationPayload = {
      userId: 'user123',
      channel: 'slack',
      channelUserId: 'U1234567890',
      message: 'Test notification message'
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
          mrkdwn: true,
          unfurl_links: false
        }
      );

      expect(result).toBe('1234567890.123456');
    });

    it('should process transaction link placeholder', async () => {
      const payloadWithTx: NotificationPayload = {
        ...mockPayload,
        message: 'New proposal created!\n\n{{txLink}}',
        metadata: {
          transaction: {
            hash: '0x123abc',
            chainId: 1
          }
        }
      };

      mockExplorerService.getTransactionLink.mockReturnValue('https://etherscan.io/tx/0x123abc');

      await slackBotService.sendNotification(payloadWithTx);

      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        'U1234567890',
        'New proposal created!\n\n<https://etherscan.io/tx/0x123abc|Transaction details>',
        {
          mrkdwn: true,
          unfurl_links: false
        }
      );
    });

    it('should remove transaction link placeholder when no transaction metadata', async () => {
      const payloadWithTx: NotificationPayload = {
        ...mockPayload,
        message: 'New proposal created!\n\n{{txLink}}'
      };

      await slackBotService.sendNotification(payloadWithTx);

      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        'U1234567890',
        'New proposal created!',
        {
          mrkdwn: true,
          unfurl_links: false
        }
      );
    });

    it('should process ENS address placeholders', async () => {
      const payloadWithAddresses: NotificationPayload = {
        ...mockPayload,
        message: 'Proposal by {{proposer}} in {{dao}}',
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
          mrkdwn: true,
          unfurl_links: false
        }
      );
    });

    it('should handle complex message with both transaction and addresses', async () => {
      const complexPayload: NotificationPayload = {
        ...mockPayload,
        message: 'New proposal by {{proposer}}!\n\n{{txLink}}',
        metadata: {
          addresses: {
            proposer: '0x742d35Cc6634C0532925a3b8D76be9D5B65F6a'
          },
          transaction: {
            hash: '0x123abc',
            chainId: 1
          }
        }
      };

      mockEnsResolver.resolveDisplayName.mockResolvedValue('alice.eth');
      mockExplorerService.getTransactionLink.mockReturnValue('https://etherscan.io/tx/0x123abc');

      await slackBotService.sendNotification(complexPayload);

      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        'U1234567890',
        'New proposal by alice.eth!\n\n<https://etherscan.io/tx/0x123abc|Transaction details>',
        {
          mrkdwn: true,
          unfurl_links: false
        }
      );
    });
  });
});