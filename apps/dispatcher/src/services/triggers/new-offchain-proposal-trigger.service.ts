import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { newOffchainProposalMessages, replacePlaceholders, buildButtons, NotificationTypeId } from '@notification-system/messages';
import crypto from 'crypto';

/**
 * Handler for processing "new-offchain-proposal" trigger messages (Snapshot proposals)
 */
export class NewOffchainProposalTriggerHandler extends BaseTriggerHandler {
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
  ) {
    super(subscriptionClient, notificationFactory);
  }

  /**
   * Handle a new offchain proposal message
   * @param message The message containing offchain proposal data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const proposal of message.events) {
      const { daoId, id: proposalId, title, created, discussion, link } = proposal;
      const eventId = `offchain-${proposalId}`;
      const proposalTimestamp = String(created);

      const subscribers = await this.getSubscribers(daoId, eventId, proposalTimestamp, NotificationTypeId.NewOffchainProposal);
      const notificationMessage = replacePlaceholders(newOffchainProposalMessages.notification, {
        daoId,
        title: title || 'Untitled Proposal'
      });

      // Build buttons — include discussion link if available, no txHash for offchain
      const buttons = buildButtons({
        triggerType: 'newOffchainProposal',
        proposalUrl: link || undefined,
        discussionUrl: discussion || undefined,
      });

      await this.sendNotificationsToSubscribers(
        subscribers,
        notificationMessage,
        eventId,
        daoId,
        undefined,
        buttons
      );
    }

    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
}
