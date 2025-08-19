import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';
import { formatTokenAmount } from '../../lib/number-formatter';

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
    const proposalTitle = proposal.title || proposal.description.split('\n')[0].replace(/^#+\s*/, '').trim();
    
    const statusEmoji: Record<string, string> = {
      'EXECUTED': '✅',
      'SUCCEEDED': '✅',
      'DEFEATED': '❌',
      'EXPIRED': '⏰',
      'CANCELED': '🚫'
    };
    
    const emoji = statusEmoji[proposal.status] || '📊';
    const statusFormatted = proposal.status.charAt(0) + proposal.status.slice(1).toLowerCase();
    
    const votes = `${formatTokenAmount(proposal.forVotes)} FOR | ${formatTokenAmount(proposal.againstVotes)} AGAINST | ${formatTokenAmount(proposal.abstainVotes)} ABSTAIN`;
    
    const header = proposalTitle 
      ? `📊 Proposal "${proposalTitle}" has ended on DAO ${proposal.daoId.toUpperCase()}`
      : `📊 A proposal has ended on DAO ${proposal.daoId.toUpperCase()}`;
    
    return `${header}

Status: ${statusFormatted} ${emoji}
Votes: ${votes}`;
  }
}