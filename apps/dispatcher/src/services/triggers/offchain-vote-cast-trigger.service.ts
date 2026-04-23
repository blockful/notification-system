import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { OffchainVoteWithDaoId } from '@notification-system/anticapture-client';
import { offchainVoteCastMessages, replacePlaceholders, NotificationTypeId } from '@notification-system/messages';
import { createLogger, type Logger } from '@anticapture/observability';

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
    logger: Logger = createLogger('dispatcher'),
  ) {
    super(subscriptionClient, notificationFactory, undefined, logger);
  }

  async handleMessage(message: DispatcherMessage<OffchainVoteWithDaoId>): Promise<MessageProcessingResult> {
    const events = message.events;

    if (!events || events.length === 0) {
      this.logger.debug({ event: 'offchain_vote_cast.no_events' }, 'no offchain vote events to process');
      return {
        messageId: `offchain-vote-cast-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Extract unique voter addresses and batch fetch wallet owners
    const voterAddresses = [...new Set(events.map(event => event.voter))];
    const walletOwners = await this.subscriptionClient.getWalletOwnersBatch(voterAddresses, NotificationTypeId.OffchainVoteCast);

    // Create all user-vote combinations
    const userVoteCombinations = this.createUserVoteCombinations(events, walletOwners);

    // Process all combinations
    const processedCount = await this.processUserVoteCombinations(userVoteCombinations);

    this.logger.info(
      { sent: processedCount.sent, skipped: processedCount.skipped, failed: processedCount.failed, event: 'offchain_vote_cast.processed' },
      'processing complete',
    );

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
        this.logger.error(
          { err: error, userId: user.id, event: 'offchain_vote_cast.process_failed' },
          'error processing offchain vote for user',
        );
        processedCount.failed++;
      }
    }

    return processedCount;
  }

  private async processUserVote(user: any, vote: OffchainVoteWithDaoId): Promise<ProcessingStatus> {
    const eventId = `offchain-${vote.daoId}-${vote.proposalId}-${vote.voter}-vote`;

    // Check if user is subscribed to the DAO
    const subscribers = await this.getSubscribers(vote.daoId, eventId, String(vote.created), NotificationTypeId.OffchainVoteCast);
    const isSubscribed = subscribers.some(sub => sub.id === user.id);

    if (!isSubscribed) {
      this.logger.debug(
        { userId: user.id, daoId: vote.daoId, event: 'offchain_vote_cast.user_not_subscribed' },
        'user not subscribed to DAO',
      );
      return 'skipped';
    }

    // Check deduplication
    const notifications = await this.subscriptionClient.shouldSend([user], eventId, vote.daoId);
    if (notifications.length === 0) {
      this.logger.debug(
        { proposalId: vote.proposalId, voter: vote.voter, event: 'offchain_vote_cast.already_sent' },
        'notification already sent for offchain vote',
      );
      return 'skipped';
    }

    // Send notification
    await this.sendVoteNotification(user, vote, eventId);
    this.logger.info(
      { userId: user.id, event: 'offchain_vote_cast.sent' },
      'sent offchain vote notification to user',
    );

    return 'sent';
  }

  private async sendVoteNotification(user: any, vote: OffchainVoteWithDaoId, eventId: string): Promise<void> {
    const message = this.formatVoteMessage(vote);

    await this.sendNotificationsToSubscribers(
      [user],
      message,
      eventId,
      vote.daoId,
      { addresses: { address: vote.voter } }
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
