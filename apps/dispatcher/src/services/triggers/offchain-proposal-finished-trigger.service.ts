import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { offchainProposalFinishedMessages, replacePlaceholders, buildButtons, NotificationTypeId } from '@notification-system/messages';

/**
 * Handler for processing "offchain-proposal-finished" trigger messages (Snapshot proposals)
 */
export class OffchainProposalFinishedTriggerHandler extends BaseTriggerHandler {
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory,
  ) {
    super(subscriptionClient, notificationFactory);
  }

  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const proposal of message.events) {
      const { daoId, id: proposalId, title, end, link } = proposal;
      const eventId = `offchain-${proposalId}-finished`;
      const proposalTimestamp = String(end);

      const subscribers = await this.getSubscribers(daoId, eventId, proposalTimestamp, NotificationTypeId.OffchainProposalFinished);

      const hasTitle = !!title;
      const messageTemplate = hasTitle
        ? offchainProposalFinishedMessages.withTitle
        : offchainProposalFinishedMessages.withoutTitle;

      const notificationMessage = replacePlaceholders(messageTemplate, {
        daoId,
        ...(hasTitle && { title })
      });

      const buttons = buildButtons({
        triggerType: 'offchainProposalFinished',
        proposalUrl: link || undefined,
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
      messageId: message.triggerId,
      timestamp: new Date().toISOString()
    };
  }
}
