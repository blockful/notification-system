import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { INotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { FormattingService } from "../formatting.service";
import { newProposalMessages, replacePlaceholders, buildButtons, buildProposalUrl, NotificationTypeId } from '@notification-system/messages';
import { IAnticaptureClient } from '@notification-system/anticapture-client';
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
    notificationFactory: INotificationClientFactory,
    anticaptureClient: IAnticaptureClient
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
        alreadySupportCalldataReview: daoInfo.supportsCalldataReview
      });

      // Structured metadata: consumers (e.g. the calldata-review webhook) read these
      // fields directly. Anything that only exists inside a button URL is unreachable.
      const proposalUrl = buildProposalUrl(daoId, proposalId);
      if (!txHash) {
        this.logger.warn(
          { daoId, proposalId, event: 'newProposal.missing_tx_hash' },
          'proposal has no txHash; webhook consumers cannot resolve on-chain identity',
        );
      }

      await this.sendNotificationsToSubscribers(
        subscribers,
        notificationMessage,
        proposalId,
        daoId,
        {
          triggerType: 'newProposal',
          daoId,
          proposalId,
          ...(proposalUrl && { proposalUrl }),
          ...(txHash && daoInfo.chainId && {
            transaction: { hash: txHash, chainId: daoInfo.chainId },
          }),
        },
        buttons
      );
    }

    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
} 