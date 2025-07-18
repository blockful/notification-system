import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';

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

  /**
   * Generates a notification message for a finished proposal
   * @param proposal The finished proposal
   * @returns Formatted notification message
   */
  private generateNotificationMessage(proposal: {
    description: string;
    daoId: string;
  }): string {
    const proposalTitle = proposal.description.split('\n')[0].replace(/^#+\s*/, '').trim();
    
    if (proposalTitle) {
      return `The proposal "${proposalTitle}" has ended on dao ${proposal.daoId}.`;
    } else {
      return `A proposal has ended on dao ${proposal.daoId}.`;
    }
  }
}