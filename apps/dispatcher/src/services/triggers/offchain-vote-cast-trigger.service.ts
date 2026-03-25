import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { OffchainVoteWithDaoId } from '@notification-system/anticapture-client';
import { offchainVoteCastMessages, replacePlaceholders } from '@notification-system/messages';

interface UserVoteCombination {
  user: any;
  vote: OffchainVoteWithDaoId;
}

interface ProcessingResult {
  sent: number;
  skipped: number;
  failed: number;
}

type ProcessingStatus = 'sent' | 'skipped';

export class OffchainVoteCastTriggerHandler extends BaseTriggerHandler<OffchainVoteWithDaoId> {
  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<OffchainVoteWithDaoId>): Promise<MessageProcessingResult> {
    const events = message.events;

    if (!events || events.length === 0) {
      console.log('[OffchainVoteCastHandler] No offchain vote events to process');
      return {
        messageId: `offchain-vote-cast-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Extract unique voter addresses and batch fetch wallet owners
    const voterAddresses = [...new Set(events.map(event => event.voter))];
    const walletOwners = await this.subscriptionClient.getWalletOwnersBatch(voterAddresses);

    // Create all user-vote combinations
    const userVoteCombinations = this.createUserVoteCombinations(events, walletOwners);

    // Process all combinations
    const processedCount = await this.processUserVoteCombinations(userVoteCombinations);

    console.log(`[OffchainVoteCastHandler] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`);

    return {
      messageId: `offchain-vote-cast-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  private createUserVoteCombinations(
    events: OffchainVoteWithDaoId[],
    walletOwners: Record<string, any[]>
  ): UserVoteCombination[] {
    return events.flatMap(voteEvent => {
      const usersForWallet = walletOwners[voteEvent.voter] || [];
      return usersForWallet.map(user => ({ user, vote: voteEvent }));
    });
  }

  private async processUserVoteCombinations(combinations: UserVoteCombination[]): Promise<ProcessingResult> {
    const processedCount: ProcessingResult = { sent: 0, skipped: 0, failed: 0 };

    for (const { user, vote } of combinations) {
      try {
        const result = await this.processUserVote(user, vote);
        processedCount[result]++;
      } catch (error) {
        console.error(`[OffchainVoteCastHandler] Error processing offchain vote for user ${user.id}:`, error);
        processedCount.failed++;
      }
    }

    return processedCount;
  }

  private async processUserVote(user: any, vote: OffchainVoteWithDaoId): Promise<ProcessingStatus> {
    const eventId = `offchain-${vote.daoId}-${vote.proposalId}-${vote.voter}-vote`;

    // Check if user is subscribed to the DAO
    const subscribers = await this.getSubscribers(vote.daoId, eventId, String(vote.created));
    const isSubscribed = subscribers.some(sub => sub.id === user.id);

    if (!isSubscribed) {
      console.log(`[OffchainVoteCastHandler] User ${user.id} not subscribed to DAO ${vote.daoId}`);
      return 'skipped';
    }

    // Check deduplication
    const notifications = await this.subscriptionClient.shouldSend([user], eventId, vote.daoId);
    if (notifications.length === 0) {
      console.log(`[OffchainVoteCastHandler] Notification already sent for offchain vote ${vote.proposalId}-${vote.voter}`);
      return 'skipped';
    }

    // Send notification
    await this.sendVoteNotification(user, vote, eventId);
    console.log(`[OffchainVoteCastHandler] Sent offchain vote notification to user ${user.id}`);

    return 'sent';
  }

  private async sendVoteNotification(user: any, vote: OffchainVoteWithDaoId, eventId: string): Promise<void> {
    const message = this.formatVoteMessage(vote);

    await this.sendNotificationsToSubscribers(
      [user],
      message,
      eventId,
      vote.daoId
    );
  }

  private formatVoteMessage(vote: OffchainVoteWithDaoId): string {
    const hasReason = vote.reason && vote.reason.trim();

    const messageTemplate = hasReason
      ? offchainVoteCastMessages.withReason
      : offchainVoteCastMessages.withoutReason;

    return replacePlaceholders(messageTemplate, {
      daoId: vote.daoId,
      proposalTitle: vote.proposalTitle,
      ...(hasReason && { reason: vote.reason! })
    });
  }
}
