import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';
import { votingReminderMessages, replacePlaceholders } from '@notification-system/messages';

/**
 * Event data received from logic system for voting reminders
 */
interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
}

/**
 * Processing statistics for monitoring
 */
interface ProcessingResult {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Handler for voting reminder trigger events.
 * Processes proposals and sends reminders to subscribed users who haven't voted yet.
 */
export class VotingReminderTriggerHandler extends BaseTriggerHandler<VotingReminderEvent> {

  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    private readonly anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<VotingReminderEvent>): Promise<MessageProcessingResult> {
    const events = message.events;
    
    if (!events || events.length === 0) {
      return { 
        messageId: `voting-reminder-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    const processedCount: ProcessingResult = { sent: 0, skipped: 0, failed: 0 };
    
    for (const event of events) {
      try {
        const result = await this.processReminderEvent(event);
        processedCount.sent += result.sent;
        processedCount.skipped += result.skipped;
        processedCount.failed += result.failed;
      } catch (error) {
        processedCount.failed++;
      }
    }

    console.log(`[VotingReminderHandler] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`);
    
    return { 
      messageId: `voting-reminder-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Processes a single voting reminder event
   */
  private async processReminderEvent(event: VotingReminderEvent): Promise<ProcessingResult> {
    // Get all subscribed addresses for this DAO
    const subscribedAddresses = await this.subscriptionClient.getFollowedAddresses(event.daoId);
    
    if (subscribedAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Check which addresses haven't voted yet
    const nonVotingAddresses = await this.getNonVotingAddresses(
      event.id, 
      event.daoId, 
      subscribedAddresses
    );

    if (nonVotingAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Get user information for non-voting addresses
    const nonVotingUsers = await this.subscriptionClient.getWalletOwnersBatch(nonVotingAddresses);
    const allUsers = Object.values(nonVotingUsers).flat();

    if (allUsers.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Filter users who should receive notifications (deduplication check)
    const eventId = `${event.id}-${event.thresholdPercentage}-reminder`;
    const filteredNotifications = await this.subscriptionClient.shouldSend(allUsers, eventId, event.daoId);
    
    const usersToNotify = allUsers.filter(user => 
      filteredNotifications.some(notification => notification.user_id === user.id)
    );

    if (usersToNotify.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Send reminders to users
    const message = this.createReminderMessage(event);
    await this.sendNotificationsToSubscribers(
      usersToNotify,
      message,
      eventId,
      event.daoId,
      {
        proposalId: event.id,
        thresholdPercentage: event.thresholdPercentage,
        timeElapsedPercentage: event.timeElapsedPercentage,
        timeRemaining: FormattingService.calculateTimeRemaining(event.endTimestamp)
      }
    );
    
    return { 
      sent: usersToNotify.length, 
      skipped: allUsers.length - usersToNotify.length, 
      failed: 0 
    };
  }

  /**
   * Gets addresses that haven't voted on the specific proposal
   */
  private async getNonVotingAddresses(
    proposalId: string, 
    daoId: string, 
    subscribedAddresses: string[]
  ): Promise<string[]> {
    const votes = await this.anticaptureClient.listVotesOnchains({
      daoId,
      proposalId_in: [proposalId],
      voterAccountId_in: subscribedAddresses
    });
    
    const voterAddresses = new Set(votes.map(vote => vote.voterAccountId.toLowerCase()));
    
    return subscribedAddresses.filter(address => 
      !voterAddresses.has(address.toLowerCase())
    );
  }

  /**
   * Creates the reminder message based on proposal data and urgency level
   */
  private createReminderMessage(event: VotingReminderEvent): string {
    const timeRemaining = FormattingService.calculateTimeRemaining(event.endTimestamp);
    const title = event.title || FormattingService.extractTitle(event.description);

    // Get the message key based on threshold
    const messageKey = votingReminderMessages.getMessageKey(event.thresholdPercentage);

    // Get the complete message template
    const messageTemplate = votingReminderMessages[messageKey];

    // Replace all placeholders
    return replacePlaceholders(messageTemplate, {
      daoId: event.daoId,
      title,
      timeRemaining,
      thresholdPercentage: event.thresholdPercentage.toString()
    });
  }
}