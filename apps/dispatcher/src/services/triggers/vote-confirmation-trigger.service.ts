import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient, VoteWithDaoId } from '@notification-system/anticapture-client';
import { formatTokenAmount } from '../../lib/number-formatter';
import { voteConfirmationMessages, replacePlaceholders, buildButtons, NotificationTypeId } from '@notification-system/messages';
import { createLogger, type Logger } from '@anticapture/observability';

interface UserVoteCombination {
  user: any;
  vote: VoteWithDaoId;
}

interface ProcessingResult {
  sent: number;
  skipped: number;
  failed: number;
}

type ProcessingStatus = 'sent' | 'skipped';


export class VoteConfirmationTriggerHandler extends BaseTriggerHandler<VoteWithDaoId> {
  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient,
    logger: Logger = createLogger('dispatcher'),
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient, logger);
  }

  async handleMessage(message: DispatcherMessage<VoteWithDaoId>): Promise<MessageProcessingResult> {
    const events = message.events;
    
    if (!events || events.length === 0) {
      this.logger.debug({ event: 'vote_confirmation.no_events' }, 'no vote events to process');
      return { 
        messageId: `vote-confirmation-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Extract unique voter addresses and batch fetch wallet owners
    const voterAddresses = [...new Set(events.map(event => event.voterAddress))];
    const walletOwners = await this.subscriptionClient.getWalletOwnersBatch(voterAddresses, NotificationTypeId.VoteConfirmation);
    
    // Create all user-vote combinations
    const userVoteCombinations = this.createUserVoteCombinations(events, walletOwners);
    
    // Process all combinations
    const processedCount = await this.processUserVoteCombinations(userVoteCombinations);

    this.logger.info(
      { sent: processedCount.sent, skipped: processedCount.skipped, failed: processedCount.failed, event: 'vote_confirmation.processed' },
      'processing complete',
    );
    
    return { 
      messageId: `vote-confirmation-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates combinations of users and votes for processing
   */
  private createUserVoteCombinations(
    events: VoteWithDaoId[],
    walletOwners: Record<string, any[]>
  ): UserVoteCombination[] {
    return events.flatMap(voteEvent => {
      const usersForWallet = walletOwners[voteEvent.voterAddress] || [];
      return usersForWallet.map(user => ({ user, vote: voteEvent }));
    });
  }

  /**
   * Processes all user-vote combinations
   */
  private async processUserVoteCombinations(combinations: UserVoteCombination[]): Promise<ProcessingResult> {
    const processedCount: ProcessingResult = { sent: 0, skipped: 0, failed: 0 };
    
    for (const { user, vote } of combinations) {
      try {
        const result = await this.processUserVote(user, vote);
        processedCount[result]++;
      } catch (error) {
        this.logger.error(
          { err: error, userId: user.id, event: 'vote_confirmation.process_failed' },
          'error processing vote for user',
        );
        processedCount.failed++;
      }
    }
    
    return processedCount;
  }

  /**
   * Processes a single user-vote combination
   */
  private async processUserVote(user: any, vote: VoteWithDaoId): Promise<ProcessingStatus> {
    const eventId = `${vote.transactionHash}-${vote.proposalId}-${vote.voterAddress}-vote`;

    // Check if user is subscribed to the DAO
    const subscribers = await this.getSubscribers(vote.daoId, eventId, String(vote.timestamp), NotificationTypeId.VoteConfirmation);
    const isSubscribed = subscribers.some(sub => sub.id === user.id);
    
    if (!isSubscribed) {
      this.logger.debug(
        { userId: user.id, daoId: vote.daoId, event: 'vote_confirmation.user_not_subscribed' },
        'user not subscribed to DAO',
      );
      return 'skipped';
    }

    // Check deduplication
    const notifications = await this.subscriptionClient.shouldSend([user], eventId, vote.daoId);
    if (notifications.length === 0) {
      this.logger.debug(
        { txHash: vote.transactionHash, event: 'vote_confirmation.already_sent' },
        'notification already sent for vote',
      );
      return 'skipped';
    }

    // Send notification
    await this.sendVoteNotification(user, vote, eventId);
    this.logger.info({ userId: user.id, event: 'vote_confirmation.sent' }, 'sent vote notification to user');
    
    return 'sent';
  }

  /**
   * Sends notification for a single vote
   */
  private async sendVoteNotification(user: any, vote: VoteWithDaoId, eventId: string): Promise<void> {
    const message = this.formatVoteMessage(vote);
    const chainId = await this.getChainIdForDao(vote.daoId);

    // Build buttons
    const buttons = buildButtons({
      triggerType: 'voteConfirmation',
      txHash: vote.transactionHash,
      chainId,
      daoId: vote.daoId,
      address: vote.voterAddress
    });

    await this.sendNotificationsToSubscribers(
      [user],
      message,
      eventId,
      vote.daoId,
      {
        triggerType: 'voteConfirmation',
        transaction: {
          hash: vote.transactionHash,
          chainId
        },
        addresses: {
          address: vote.voterAddress
        },
        proposalId: vote.proposalId,
        support: String(vote.support),
        votingPower: vote.votingPower,
        reason: vote.reason
      },
      buttons
    );
  }

  private formatVoteMessage(vote: VoteWithDaoId): string {
    const supportKey = voteConfirmationMessages.getSupportKey(String(vote.support));
    const votingPower = formatTokenAmount(vote.votingPower, 18);
    const hasReason = vote.reason && vote.reason.trim();

    const messageTemplate = hasReason
      ? voteConfirmationMessages.withReason[supportKey]
      : voteConfirmationMessages.withoutReason[supportKey];

    return replacePlaceholders(messageTemplate, {
      daoId: vote.daoId,
      proposalTitle: vote.proposalTitle ?? undefined,
      votingPower,
      ...(hasReason && { reason: vote.reason! })
    });
  }
}