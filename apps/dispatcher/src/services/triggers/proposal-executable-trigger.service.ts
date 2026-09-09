import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { INotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalExecutableNotification } from '../../interfaces/notification-client.interface';
import { NotificationTypeId } from '@notification-system/messages';

/**
 * Webhook-only handler: tells machine subscribers (e.g. the ENS relayer) that a
 * proposal can be executed. Humans are not notified; the message text is fixed
 * because webhook consumers read `metadata`, not the text.
 */
export class ProposalExecutableTriggerHandler extends BaseTriggerHandler<ProposalExecutableNotification> {
  constructor(subscriptionClient: ISubscriptionClient, notificationFactory: INotificationClientFactory) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<ProposalExecutableNotification>): Promise<MessageProcessingResult> {
    for (const proposal of message.events) {
      const eventId = `${proposal.id}-executable`;

      const subscribers = (await this.getSubscribers(
        proposal.daoId,
        eventId,
        proposal.endTimestamp.toString(),
        NotificationTypeId.ProposalExecutable,
      )).filter(subscriber => subscriber.channel === 'webhook');

      if (subscribers.length === 0) {
        continue;
      }

      await this.sendNotificationsToSubscribers(
        subscribers,
        `Proposal ${proposal.id} on ${proposal.daoId.toUpperCase()} is ready to execute`,
        eventId,
        proposal.daoId,
        {
          triggerType: 'proposalExecutable',
          daoId: proposal.daoId,
          proposalId: proposal.id,
          status: proposal.status,
        },
      );
    }

    return { messageId: message.triggerId, timestamp: new Date().toISOString() };
  }
}
