import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { FormattingService } from "../formatting.service";
import { newProposalMessages, replacePlaceholders, buildButtons, NotificationTypeId } from '@notification-system/messages';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import crypto from 'crypto';

/**
 * Handler for processing "new-proposal" trigger messages
 */
export class NewProposalTriggerHandler extends BaseTriggerHandler {
  /**
   * Creates a new instance of the NewProposalTriggerHandler
   * @param subscriptionClient Client for subscription server API
   * @param notificationFactory Factory for creating notification clients
   * @param anticaptureClient Client for AntiCapture API
   */
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
    anticaptureClient: AnticaptureClient
  ) {
    super(subscriptionClient, notificationFactory, anticaptureClient);
  }

  /**
   * Handle a new proposal message
   * @param message The message containing proposal data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const proposal of message.events) {
      const { daoId, id: proposalId, title, description, timestamp, txHash } = proposal;
      const proposalTitle = title || FormattingService.extractTitle(description, 'Unnamed Proposal');
      const subscribers = await this.getSubscribers(daoId, proposalId, timestamp, NotificationTypeId.NewProposal);
      const notificationMessage = replacePlaceholders(newProposalMessages.notification, {
        daoId,
        title: proposalTitle
      });

      // Build buttons with transaction hash and calldata review CTA
      const daoInfo = await this.getDaoInfo(daoId);
      const buttons = buildButtons({
        triggerType: 'newProposal',
        txHash: txHash,
        chainId: daoInfo.chainId,
        daoId,
        proposalId,
        alreadySupportCalldataReview: daoInfo.alreadySupportCalldataReview
      });

      await this.sendNotificationsToSubscribers(
        subscribers,
        notificationMessage,
        proposalId,
        daoId,
        { triggerType: 'newProposal' },
        buttons
      );
    }

    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
} 