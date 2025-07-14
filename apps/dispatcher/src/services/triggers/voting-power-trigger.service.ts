import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import crypto from 'crypto';

/**
 * Handler for processing "voting-power-changed" trigger messages
 */
export class VotingPowerTriggerHandler extends BaseTriggerHandler {
  /**
   * Creates a new instance of the VotingPowerTriggerHandler
   * @param subscriptionClient Client for subscription server API
   * @param notificationFactory Factory for creating notification clients
   */
  constructor(
    subscriptionClient: ISubscriptionClient,
    notificationFactory: NotificationClientFactory
  ) {
    super(subscriptionClient, notificationFactory);
  }

  /**
   * Handle a voting power changed message
   * @param message The message containing voting power history data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const votingPowerHistory of message.events) {
      const { daoId, accountId, votingPower, timestamp, delta, transactionHash, changeType, sourceAccountId, targetAccountId } = votingPowerHistory;
      
      if (!daoId || !accountId || !transactionHash) {
        continue;
      }

      const subscribers = await this.getSubscribers(daoId, transactionHash, timestamp);
      
      let notificationMessage = '';
      
      const deltaValue = delta ? parseInt(delta) : 0;
      const deltaSign = deltaValue > 0 ? '+' : '';
      const deltaText = deltaValue !== 0 ? ` (${deltaSign}${deltaValue})` : '';

      //TODO: review this messages
      if (changeType === 'delegation') {
        // Delegation event - sourceAccountId is delegatorAccountId
        if (deltaValue > 0) {
          notificationMessage = `📈 Your voting power increased in ${daoId}: ${sourceAccountId} delegated voting power to you${deltaText}. New total: ${votingPower}`;
        } else if (deltaValue < 0) {
          notificationMessage = `📉 Your voting power decreased in ${daoId}: ${sourceAccountId} removed delegation from you${deltaText}. New total: ${votingPower}`;
        } else {
          notificationMessage = `🔄 Delegation activity in ${daoId}: ${sourceAccountId} modified delegation. Current voting power: ${votingPower}`;
        }
      } else if (changeType === 'transfer') {
        // Transfer event - check who caused the change based on delta
        if (deltaValue > 0) {
          // Received tokens - sourceAccountId is fromAccountId (who sent)
          notificationMessage = `📈 Your voting power increased in ${daoId}: ${sourceAccountId} transferred tokens to you${deltaText}. New total: ${votingPower}`;
        } else if (deltaValue < 0) {
          // Sent tokens - targetAccountId is toAccountId (who received)  
          notificationMessage = `📉 Your voting power decreased in ${daoId}: you transferred tokens to ${targetAccountId}${deltaText}. New total: ${votingPower}`;
        } else {
          notificationMessage = `🔄 Token transfer activity in ${daoId}. Current voting power: ${votingPower}`;
        }
      } else {
        // Generic voting power change
        notificationMessage = `⚡ Voting power changed in ${daoId}${deltaText}. Current voting power: ${votingPower}`;
      }
      
      if (notificationMessage) {
        await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId);
      }
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
}