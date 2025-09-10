import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';

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
        timeRemaining: this.calculateTimeRemaining(event.endTimestamp)
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
    const timeRemaining = this.calculateTimeRemaining(event.endTimestamp);
    
    // Determine urgency level and emoji directly based on threshold
    const urgencyLevel = event.thresholdPercentage >= 80 ? 'URGENT' :
                        event.thresholdPercentage >= 50 ? 'Mid-Period' :
                        event.thresholdPercentage >= 30 ? 'Early' : 'Voting';
    
    const emoji = event.thresholdPercentage >= 80 ? '🚨' :
                  event.thresholdPercentage >= 50 ? '⏰' :
                  event.thresholdPercentage >= 30 ? '🔔' : '🗳️';
    
    // Extract title from description if not available
    const title = event.title || FormattingService.extractTitle(event.description);
    
    let message = `${emoji} ${urgencyLevel} Voting Reminder - ${event.daoId}\n\n`;
    
    if (title) {
      message += `Proposal: "${title}"\n\n`;
    }
    
    message += `⏱️ Time remaining: ${timeRemaining}\n`;
    message += `📊 ${event.thresholdPercentage}% of voting period has passed\n`;
    message += `🗳️ Your vote hasn't been recorded yet\n\n`;
    
    if (event.thresholdPercentage >= 80) {
      message += `⚠️ This proposal is closing soon! Don't miss your chance to participate in governance.\n\n`;
    } else if (event.thresholdPercentage >= 50) {
      message += `⏰ More than half of the voting period has passed. Consider casting your vote soon.\n\n`;
    } else {
      message += `🔔 The voting period is underway. Take your time to review and vote.\n\n`;
    }
    
    message += `Participate in governance and make your voice heard!`;
    
    return message;
  }

  /**
   * Calculates human-readable time remaining
   */
  private calculateTimeRemaining(endTimestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = endTimestamp - now;
    
    if (secondsRemaining <= 0) {
      return 'Proposal has ended';
    }
    
    const days = Math.floor(secondsRemaining / (24 * 60 * 60));
    const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
    
    // Round 59-61 minutes to 1 hour for better UX
    if (hours === 0 && minutes >= 59) {
      return '~1 hour';
    }
    
    if (days > 0) {
      return `~${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` and ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `~${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    } else {
      return `~${Math.max(1, minutes)} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
}