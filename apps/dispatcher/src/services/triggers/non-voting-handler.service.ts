import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';
import { AnticaptureClient, QueryInput_Proposals_OrderDirection } from '@notification-system/anticapture-client';

/**
 * Handler for detecting non-voting addresses on proposal finished events
 * Processes the same proposal-finished events but checks for addresses
 * that haven't participated in recent governance
 */
export class NonVotingHandler extends BaseTriggerHandler<ProposalFinishedNotification> {
  private static readonly PROPOSALS_TO_CHECK = 3;
  
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
    private anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage<ProposalFinishedNotification>): Promise<MessageProcessingResult> {
    const proposals = message.events;

    for (const proposal of proposals) {
      try {
        await this.processNonVotingAddresses(proposal);
      } catch (error) {
        console.error(`Error processing non-voting addresses for proposal ${proposal.id}:`, error);
        // Continue processing other proposals even if one fails
      }
    }

    return {
      messageId: message.triggerId,
      timestamp: new Date().toISOString()
    };
  }

  private async processNonVotingAddresses(currentProposal: ProposalFinishedNotification): Promise<void> {
    // Step 1: Get last 3 finished proposals (including current one)
    const lastProposals = await this.getLastFinishedProposals(
      currentProposal.daoId, 
      currentProposal.endTimestamp
    );
    
    if (lastProposals.length < NonVotingHandler.PROPOSALS_TO_CHECK) {
      console.log(`Not enough proposals for DAO ${currentProposal.daoId}. Found: ${lastProposals.length}`);
      return;
    }

    // Step 2: Get followed addresses for this DAO
    const followedAddresses = await this.subscriptionClient.getFollowedAddresses(currentProposal.daoId);
    
    if (followedAddresses.length === 0) {
      console.log(`No followed addresses for DAO ${currentProposal.daoId}`);
      return;
    }

    // Step 3: Get votes for these addresses in these proposals
    const proposalIds = lastProposals.map(p => p.id);
    const votes = await this.anticaptureClient.listVotesOnchains({
      daoId: currentProposal.daoId,
      proposalId_in: proposalIds,
      voterAccountId_in: followedAddresses
    });

    // Step 4: Identify non-voters (addresses that haven't voted in ANY of the 3 proposals)
    const voterAddresses = new Set(votes.map(v => v.voterAccountId.toLowerCase()));
    const nonVoters = followedAddresses.filter(
      addr => !voterAddresses.has(addr.toLowerCase())
    );

    console.log(`Found ${nonVoters.length} non-voting addresses`);

    // Step 5: Send notifications about non-voters (batch processing)
    if (nonVoters.length > 0) {
      await this.notifyAboutNonVotersBatch(
        nonVoters, 
        currentProposal.daoId, 
        lastProposals
      );
    }
  }

  private async getLastFinishedProposals(
    daoId: string, 
    currentEndTimestamp: number
  ): Promise<any[]> {
    // Query last 3 proposals that have ended (including current)
    const proposals = await this.anticaptureClient.listProposals({
      status: ['EXECUTED', 'SUCCEEDED', 'DEFEATED', 'EXPIRED', 'CANCELED'],
      fromDate: currentEndTimestamp, // fromDate acts as "up to" date
      limit: NonVotingHandler.PROPOSALS_TO_CHECK,
      orderDirection: QueryInput_Proposals_OrderDirection.Desc
    }, daoId);

    return proposals;
  }

  private async notifyAboutNonVotersBatch(
    addresses: string[],
    daoId: string,
    lastProposals: any[]
  ): Promise<void> {
    // Batch 1: Get all followers for all addresses in a single request
    const addressFollowersMap = await this.subscriptionClient.getWalletOwnersBatch(addresses);
    const addressFollowers = addresses
      .map(address => ({ address, followers: addressFollowersMap[address] || [] }));
    
    // Filter out addresses with no followers
    const validAddressFollowers = addressFollowers.filter(af => af.followers.length > 0);
    if (validAddressFollowers.length === 0) return;

    // Batch 2: Check deduplication for all addresses
    const deduplicationPromises = validAddressFollowers.map(({ address, followers }) => {
      const eventId = `${address}-non-voting-${lastProposals[0].id}`;
      return this.subscriptionClient.shouldSend(followers, eventId, daoId)
        .then(notificationsToSend => ({ address, followers, notificationsToSend }));
    });
    const deduplicationResults = await Promise.all(deduplicationPromises);
    
    // Filter out addresses with no notifications to send
    const validNotifications = deduplicationResults.filter(result => result.notificationsToSend.length > 0);
    if (validNotifications.length === 0) return;

    // Generate proposal titles once (shared by all notifications)
    const proposalTitles = lastProposals
      .map(p => {
        const title = p.title || p.description.split('\n')[0].replace(/^#+\s*/, '').trim();
        return `• ${title}`;
      })
      .join('\n');

    // Batch 3: Send all notifications and mark as sent
    const sendPromises: Promise<void>[] = [];
    const allNotificationsToMark: any[] = [];

    for (const { address, followers, notificationsToSend } of validNotifications) {
      // Create follower lookup map for O(1) access
      const followerMap = new Map(followers.map(f => [f.id, f]));
      
      const message = `⚠️ Non-Voting Alert for DAO ${daoId.toUpperCase()}

The address ${this.formatAddress(address)} that you follow hasn't voted in the last ${NonVotingHandler.PROPOSALS_TO_CHECK} proposals:

${proposalTitles}

Consider reaching out to encourage participation!`;

      // Send notifications for this address
      for (const notification of notificationsToSend) {
        const follower = followerMap.get(notification.user_id);
        if (!follower) continue;

        sendPromises.push(
          this.notificationFactory
            .getClient(follower.channel)
            .sendNotification({
              userId: follower.id,
              channel: follower.channel,
              channelUserId: follower.channel_user_id,
              message,
              metadata: {
                addresses: {
                  'nonVoterAddress': address
                }
              }
            })
            .catch(error => {
              console.error(`Failed to send notification to user ${follower.id}:`, error);
            })
        );
      }
      
      // Collect notifications to mark as sent
      allNotificationsToMark.push(...notificationsToSend);
    }

    // Execute all sends in parallel and mark as sent
    await Promise.all([
      Promise.all(sendPromises),
      this.subscriptionClient.markAsSent(allNotificationsToMark)
    ]);
  }

  private formatAddress(address: string): string {
    // Format as 0x1234...5678
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}