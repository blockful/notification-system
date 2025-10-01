import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';
import { formatTokenAmount } from '../../lib/number-formatter';
import { FormattingService } from '../formatting.service';
import { proposalFinishedMessages, replacePlaceholders } from '@notification-system/messages';

/**
 * Handler for proposal finished trigger events
 */
export class ProposalFinishedTriggerHandler extends BaseTriggerHandler<ProposalFinishedNotification> {
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<ProposalFinishedNotification>): Promise<MessageProcessingResult> {
    const proposals = message.events;

    for (const proposal of proposals) {
      const eventId = `${proposal.id}-finished`;
      
      const subscribers = await this.getSubscribers(
        proposal.daoId,
        eventId,
        proposal.endTimestamp.toString()
      );

      if (subscribers.length === 0) {
        continue;
      }

      const notificationMessage = this.generateNotificationMessage(proposal);
      
      await this.sendNotificationsToSubscribers(
        subscribers,
        notificationMessage,
        eventId,
        proposal.daoId
      );
    }

    return {
      messageId: message.triggerId,
      timestamp: new Date().toISOString()
    };
  }

  private generateNotificationMessage(proposal: ProposalFinishedNotification): string {
    const proposalTitle = proposal.title || FormattingService.extractTitle(proposal.description);
    const hasTitle = !!proposalTitle;

    const messageTemplate = proposalFinishedMessages.getMessageTemplate(hasTitle, proposal.status);

    return replacePlaceholders(messageTemplate, {
      ...(hasTitle && { title: proposalTitle }),
      daoId: proposal.daoId.toUpperCase(),
      forVotes: formatTokenAmount(proposal.forVotes),
      againstVotes: formatTokenAmount(proposal.againstVotes),
      abstainVotes: formatTokenAmount(proposal.abstainVotes)
    });
  }
}