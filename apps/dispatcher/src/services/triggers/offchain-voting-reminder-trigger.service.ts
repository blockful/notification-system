import type { NotificationTypeId } from '@notification-system/messages';
import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';
import { offchainVotingReminderMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';
import { BatchNotificationService } from '../batch-notification.service';

/**
 * Event data received from logic system for off-chain voting reminders
 */
interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
  link?: string;
  discussion?: string;
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
 * Handler for off-chain (Snapshot) voting reminder trigger events.
 * Processes proposals and sends reminders to subscribed users who haven't voted yet.
 * Differs from on-chain handler: uses getOffchainProposalNonVoters (no daoId),
 * single message template, and Snapshot-specific buttons.
 */
export class OffchainVotingReminderTriggerHandler extends BaseTriggerHandler<VotingReminderEvent> {
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
        messageId: `offchain-voting-reminder-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
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

    console.log(`[OffchainVotingReminderHandler] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`);

    return {
      messageId: `offchain-voting-reminder-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Processes a single off-chain voting reminder event
   */
  private async processReminderEvent(event: VotingReminderEvent, triggerType: NotificationTypeId): Promise<ProcessingResult> {
    // Get all subscribed addresses for this DAO
    const subscribedAddresses = await this.subscriptionClient.getFollowedAddresses(event.daoId);

    if (subscribedAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Check which addresses haven't voted yet on the off-chain proposal
    const nonVotingAddresses = await this.getNonVotingAddresses(event.id, subscribedAddresses);

    if (nonVotingAddresses.length === 0) {
      return { sent: 0, skipped: 1, failed: 0 };
    }

    // Build buttons: Snapshot proposal link + optional discussion link
    const buttons = buildButtons({
      triggerType: 'offchainVotingReminder',
      proposalUrl: event.link,
      discussionUrl: event.discussion,
    });

    // Send reminders using batch notification service
    const sentCount = await this.batchNotificationService.sendBatchNotifications(
      nonVotingAddresses,
      event.daoId,
      triggerType,
      () => `${event.id}-${event.thresholdPercentage}-offchain-reminder`,
      (address) => this.createReminderMessage(event, address),
      (address) => ({
        triggerType: 'offchainVotingReminder',
        proposalId: event.id,
        thresholdPercentage: event.thresholdPercentage,
        timeElapsedPercentage: event.timeElapsedPercentage,
        timeRemaining: FormattingService.calculateTimeRemaining(event.endTimestamp),
        addresses: { address: address }
      }),
      () => buttons
    );

    return { sent: sentCount, skipped: 0, failed: 0 };
  }

  /**
   * Gets addresses that haven't voted on the specific off-chain proposal.
   * Note: unlike on-chain, no daoId is needed for the Snapshot query.
   */
  private async getNonVotingAddresses(
    proposalId: string,
    subscribedAddresses: string[]
  ): Promise<string[]> {
    const nonVoters = await this.anticaptureClient!.getOffchainProposalNonVoters(
      proposalId,
      subscribedAddresses
    );
    return nonVoters.map(nv => nv.voter);
  }

  /**
   * Creates the reminder message using the single off-chain template
   */
  private createReminderMessage(event: VotingReminderEvent, address?: string): string {
    const timeRemaining = FormattingService.calculateTimeRemaining(event.endTimestamp);
    const title = event.title || 'Untitled Proposal';

    return replacePlaceholders(offchainVotingReminderMessages.default, {
      daoId: event.daoId,
      title,
      timeRemaining,
      thresholdPercentage: event.thresholdPercentage.toString(),
      address: address || ''
    });
  }
}
