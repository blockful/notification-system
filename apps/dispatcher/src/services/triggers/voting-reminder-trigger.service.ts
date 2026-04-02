import type { NotificationTypeId } from '@notification-system/messages';

import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';
import { replacePlaceholders, buildButtons } from '@notification-system/messages';
import { BatchNotificationService } from '../batch-notification.service';
import {
  VotingReminderEvent,
  NonVotersSource,
  VotingReminderMessageSet,
} from '../../interfaces/voting-reminder.interface';

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
    anticaptureClient: AnticaptureClient,
    private readonly nonVotersSource: NonVotersSource,
    private readonly messages: VotingReminderMessageSet,
    private readonly triggerType: string,
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
    this.batchNotificationService = new BatchNotificationService(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<VotingReminderEvent>): Promise<MessageProcessingResult> {
    const events = message.events;

    if (!events || events.length === 0) {
      return {
        messageId: `${this.triggerType}-empty-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
    }

    const processedCount: ProcessingResult = { sent: 0, skipped: 0, failed: 0 };
    
    for (const event of events) {
      try {
        const result = await this.processReminderEvent(event, message.triggerId);
        processedCount.sent += result.sent;
        processedCount.skipped += result.skipped;
        processedCount.failed += result.failed;
      } catch (error) {
        processedCount.failed++;
      }
    }

    console.log(
      `[${this.triggerType}] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`,
    );

    return {
      messageId: `${this.triggerType}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Processes a single voting reminder event
   */
  private async processReminderEvent(event: VotingReminderEvent, triggerType: NotificationTypeId): Promise<ProcessingResult> {
    // Get all subscribed addresses for this DAO
    const subscribedAddresses = await this.subscriptionClient.getFollowedAddresses(event.daoId);
    
    if (subscribedAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Check which addresses haven't voted yet
    const nonVoters = await this.nonVotersSource.getNonVoters(event.id, event.daoId, subscribedAddresses);
    const nonVotingAddresses = nonVoters.map((nv) => nv.voter);

    if (nonVotingAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Build buttons for voting reminder
    const buttons = buildButtons({
      triggerType: this.triggerType,
      daoId: event.daoId,
      proposalId: event.id,
      proposalUrl: event.link,
      discussionUrl: event.discussion,
    });

    // Send reminders using batch notification service
    const sentCount = await this.batchNotificationService.sendBatchNotifications(
      nonVotingAddresses,
      event.daoId,
      triggerType,
      () => `${event.id}-${event.thresholdPercentage}-${this.triggerType}`,
      (_address) => this.createReminderMessage(event),
      (address) => ({
        triggerType: this.triggerType,
        proposalId: event.id,
        thresholdPercentage: event.thresholdPercentage,
        timeElapsedPercentage: event.timeElapsedPercentage,
        timeRemaining: FormattingService.calculateTimeRemaining(event.endTimestamp),
        addresses: { address: address },
      }),
      () => buttons,
    );

    return { sent: sentCount, skipped: 0, failed: 0 };
  }

  /**
   * Creates the reminder message based on proposal data and urgency level
   */
  private createReminderMessage(event: VotingReminderEvent): string {
    const timeRemaining = FormattingService.calculateTimeRemaining(event.endTimestamp);
    const title =
      event.title || FormattingService.extractTitle(event.description ?? '') || 'Untitled Proposal';

    // Get the message key based on threshold
    const messageKey = this.messages.getMessageKey(event.thresholdPercentage);

    // Get the complete message template
    const messageTemplate = this.messages.getTemplate(messageKey);

    // Replace all placeholders
    return replacePlaceholders(messageTemplate, {
      daoId: event.daoId,
      title,
      timeRemaining,
      thresholdPercentage: event.thresholdPercentage.toString(),
    });
  }
}
