import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';
import { votingReminderMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';
import { BatchNotificationService } from '../batch-notification.service';

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
  private readonly batchNotificationService: BatchNotificationService;

  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
    this.batchNotificationService = new BatchNotificationService(subscriptionClient, notificationFactory);
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

    // Build buttons for voting reminder (no tx hash)
    const buttons = buildButtons({
      triggerType: 'votingReminder'
    });

    // Send reminders using batch notification service
    await this.batchNotificationService.sendBatchNotifications(
      nonVotingAddresses,
      event.daoId,
      () => `${event.id}-${event.thresholdPercentage}-reminder`,
      (address) => this.createReminderMessage(event, address),
      (address) => ({
        proposalId: event.id,
        thresholdPercentage: event.thresholdPercentage,
        timeElapsedPercentage: event.timeElapsedPercentage,
        timeRemaining: FormattingService.calculateTimeRemaining(event.endTimestamp),
        addresses: { address: address }
      }),
      () => buttons
    );
    return {
      sent: 1,
      skipped: 0,
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
    const nonVoters = await this.anticaptureClient!.getProposalNonVoters(
      proposalId,
      daoId,
      subscribedAddresses
    );
    return nonVoters.filter(nv => nv !== null).map(nv => nv.voter);
  }

  /**
   * Creates the reminder message based on proposal data and urgency level
   */
  private createReminderMessage(event: VotingReminderEvent, address?: string): string {
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