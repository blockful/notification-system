import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { formatTokenAmount } from '../../lib/number-formatter';
import { voteConfirmationMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';
import { FormattingService } from '../formatting.service';

interface VoteEvent {
  daoId: string;
  proposalId: string;
  voterAccountId: string;
  support: string;
  votingPower: string;
  timestamp: string;
  txHash: string;
  reason?: string | null;
  proposalDescription?: string | null;
}

interface UserVoteCombination {
  user: any;
  vote: VoteEvent;
}

interface ProcessingResult {
  sent: number;
  skipped: number;
  failed: number;
}

type ProcessingStatus = 'sent' | 'skipped';


export class VoteConfirmationTriggerHandler extends BaseTriggerHandler<VoteEvent> {
  constructor(
    protected readonly subscriptionClient: ISubscriptionClient,
    protected readonly notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
  }

  async handleMessage(message: DispatcherMessage<VoteEvent>): Promise<MessageProcessingResult> {
    const events = message.events;
    
    if (!events || events.length === 0) {
      console.log('[VoteConfirmationHandler] No vote events to process');
      return { 
        messageId: `vote-confirmation-empty-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Extract unique voter addresses and batch fetch wallet owners
    const voterAddresses = [...new Set(events.map(event => event.voterAccountId))];
    const walletOwners = await this.subscriptionClient.getWalletOwnersBatch(voterAddresses);
    
    // Create all user-vote combinations
    const userVoteCombinations = this.createUserVoteCombinations(events, walletOwners);
    
    // Process all combinations
    const processedCount = await this.processUserVoteCombinations(userVoteCombinations);

    console.log(`[VoteConfirmationHandler] Processing complete - Sent: ${processedCount.sent}, Skipped: ${processedCount.skipped}, Failed: ${processedCount.failed}`);
    
    return { 
      messageId: `vote-confirmation-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Creates combinations of users and votes for processing
   */
  private createUserVoteCombinations(
    events: VoteEvent[],
    walletOwners: Record<string, any[]>
  ): UserVoteCombination[] {
    return events.flatMap(voteEvent => {
      const usersForWallet = walletOwners[voteEvent.voterAccountId] || [];
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
        console.error(`[VoteConfirmationHandler] Error processing vote for user ${user.id}:`, error);
        processedCount.failed++;
      }
    }
    
    return processedCount;
  }

  /**
   * Processes a single user-vote combination
   */
  private async processUserVote(user: any, vote: VoteEvent): Promise<ProcessingStatus> {
    // Check if user is subscribed to the DAO
    const subscribers = await this.getSubscribers(vote.daoId, vote.txHash, vote.timestamp);
    const isSubscribed = subscribers.some(sub => sub.id === user.id);
    
    if (!isSubscribed) {
      console.log(`[VoteConfirmationHandler] User ${user.id} not subscribed to DAO ${vote.daoId}`);
      return 'skipped';
    }

    // Check deduplication
    const notifications = await this.subscriptionClient.shouldSend([user], vote.txHash, vote.daoId);
    if (notifications.length === 0) {
      console.log(`[VoteConfirmationHandler] Notification already sent for vote ${vote.txHash}`);
      return 'skipped';
    }

    // Send notification
    await this.sendVoteNotification(user, vote);
    console.log(`[VoteConfirmationHandler] Sent vote notification to user ${user.id}`);
    
    return 'sent';
  }

  /**
   * Sends notification for a single vote
   */
  private async sendVoteNotification(user: any, vote: VoteEvent): Promise<void> {
    const message = this.formatVoteMessage(vote);
    const chainId = await this.getChainIdForDao(vote.daoId);

    // Build buttons
    const buttons = buildButtons({
      triggerType: 'voteConfirmation',
      txHash: vote.txHash,
      chainId
    });

    await this.sendNotificationsToSubscribers(
      [user],
      message,
      vote.txHash,
      vote.daoId,
      {
        transaction: {
          hash: vote.txHash,
          chainId
        },
        addresses: {
          address: vote.voterAccountId
        },
        proposalId: vote.proposalId,
        support: vote.support,
        votingPower: vote.votingPower,
        reason: vote.reason
      },
      buttons
    );
  }

  private formatVoteMessage(vote: VoteEvent): string {
    const supportKey = voteConfirmationMessages.getSupportKey(vote.support);
    const votingPower = formatTokenAmount(vote.votingPower, 18);
    const hasReason = vote.reason && vote.reason.trim();
    const proposalTitle = FormattingService.extractTitle(
      vote.proposalDescription || '',
      vote.proposalId
    );

    const messageTemplate = hasReason
      ? voteConfirmationMessages.withReason[supportKey]
      : voteConfirmationMessages.withoutReason[supportKey];

    return replacePlaceholders(messageTemplate, {
      daoId: vote.daoId,
      proposalTitle,
      votingPower,
      ...(hasReason && { reason: vote.reason! })
    });
  }
}