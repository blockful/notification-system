import { BaseTriggerHandler } from './base-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';
import { AnticaptureClient, QueryInput_Proposals_OrderDirection } from '@notification-system/anticapture-client';
import { BatchNotificationService } from '../batch-notification.service';
import { FormattingService } from '../formatting.service';
import { ValidationService } from '../validation.service';
import { nonVotingMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';

/**
 * Handler for detecting non-voting addresses on proposal finished events
 * Processes the same proposal-finished events but checks for addresses
 * that haven't participated in recent governance
 */
export class NonVotingHandler extends BaseTriggerHandler<ProposalFinishedNotification> {
  private static readonly PROPOSALS_TO_CHECK = 3;
  private static readonly FETCH_MARGIN_MULTIPLIER = 5;
  private readonly batchNotificationService: BatchNotificationService;
  
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
    this.batchNotificationService = new BatchNotificationService(subscriptionClient, notificationFactory);
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

  /**
   * Processes non-voting addresses for a finished proposal
   * Orchestrates the detection and notification flow
   */
  private async processNonVotingAddresses(currentProposal: ProposalFinishedNotification): Promise<void> {
    const lastProposals = await this.getLastFinishedProposals(
      currentProposal.daoId, 
      currentProposal.endTimestamp
    );
    
    if (!ValidationService.hasMinimumItems(
      lastProposals, 
      NonVotingHandler.PROPOSALS_TO_CHECK, 
      `proposals for DAO ${currentProposal.daoId}`
    )) {
      return;
    }

    const followedAddresses = await this.subscriptionClient.getFollowedAddresses(currentProposal.daoId);
    
    if (!ValidationService.hasItems(
      followedAddresses, 
      `followed addresses for DAO ${currentProposal.daoId}`
    )) {
      return;
    }

    const nonVoters = await this.detectNonVoters(
      followedAddresses, 
      lastProposals, 
      currentProposal.daoId
    );

    if (nonVoters.length > 0) {
      await this.sendNonVoterNotifications(nonVoters, currentProposal.daoId, lastProposals);
    }
  }

  /**
   * Detects addresses that haven't voted in the last N proposals
   * @param followedAddresses - List of addresses being followed
   * @param lastProposals - Recent finished proposals to check
   * @param daoId - DAO identifier
   * @returns Array of non-voting addresses with voting power > 0
   */
  private async detectNonVoters(
    followedAddresses: string[],
    lastProposals: any[],
    daoId: string
  ): Promise<string[]> {
    const nonVoterSets = await Promise.all(
      lastProposals.map(p =>
        this.anticaptureClient!.getProposalNonVoters(p.id, daoId, followedAddresses)
      )
    );

    // Only addresses that appear as non-voters in ALL proposals
    return followedAddresses.filter(addr =>
      nonVoterSets.every(set =>
        set.some(nv => nv.voter.toLowerCase() === addr.toLowerCase())
      )
    );
  }

  /**
   * Sends notifications about non-voting addresses using batch processing
   * @param nonVoters - List of non-voting addresses
   * @param daoId - DAO identifier
   * @param lastProposals - Recent proposals for context
   */
  private async sendNonVoterNotifications(
    nonVoters: string[],
    daoId: string,
    lastProposals: any[]
  ): Promise<void> {
    const proposalTitles = FormattingService.formatProposalList(lastProposals);

    // Build buttons for non-voting (no tx hash)
    const buttons = buildButtons({
      triggerType: 'nonVoting'
    });

    await this.batchNotificationService.sendBatchNotifications(
      nonVoters,
      daoId,
      (address) => `${address}-non-voting-${lastProposals[0].id}`,
      (address) => {
        return replacePlaceholders(nonVotingMessages.alert, {
          daoId: daoId.toUpperCase(),
          proposalsCount: NonVotingHandler.PROPOSALS_TO_CHECK.toString(),
          proposalsList: proposalTitles
        });
      },
      (address) => ({
        addresses: {
          'nonVoterAddress': address
        }
      }),
      () => buttons
    );
  }


  /**
   * Fetches the last N finished proposals for a DAO
   * @param daoId - DAO identifier
   * @param currentEndTimestamp - End timestamp of current proposal
   * @returns Array of finished proposals
   */
  private async getLastFinishedProposals(
    daoId: string,
    currentEndTimestamp: number
  ): Promise<any[]> {
    const proposals = await this.anticaptureClient!.listProposals({
      status: ['EXECUTED', 'SUCCEEDED', 'DEFEATED', 'EXPIRED', 'CANCELED'],
      limit: NonVotingHandler.PROPOSALS_TO_CHECK * NonVotingHandler.FETCH_MARGIN_MULTIPLIER,
      orderDirection: QueryInput_Proposals_OrderDirection.Desc
    }, daoId);

    // If proposals is undefined or empty, return empty array
    if (!proposals || !Array.isArray(proposals)) {
      return [];
    }

    // Sort by endTimestamp (most recent first)
    const sortedByEndTime = proposals.sort((a, b) => {
      if (!a || !b) return 0;
      return parseInt(b.endTimestamp) - parseInt(a.endTimestamp);
    });
    
    // Filter proposals that ended up to the current moment (includes current)
    // and get the most recent PROPOSALS_TO_CHECK proposals
    return sortedByEndTime
      .filter(p => p && parseInt(p.endTimestamp) <= currentEndTimestamp)
      .slice(0, NonVotingHandler.PROPOSALS_TO_CHECK);
  }
}