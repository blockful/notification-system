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
   * Formats vote delta for display
   * @param delta The vote delta value
   * @returns Formatted string like "100 votes"
   */
  private formatVoteDelta(delta: number): string {
    const absoluteDelta = Math.abs(delta);
    return `${absoluteDelta} vote${absoluteDelta !== 1 ? 's' : ''}`;
  }

  /**
   * Handle a voting power changed message
   * @param message The message containing voting power history data
   */
  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    for (const votingPowerEvent of message.events) {
      const { daoId, accountId, votingPower, timestamp, delta, transactionHash, changeType, sourceAccountId, targetAccountId } = votingPowerEvent;
      
      if (!daoId || !accountId || !transactionHash) {
        continue;
      }

      const subscribers = await this.getSubscribers(daoId, transactionHash, timestamp);
      
      let notificationMessage = '';
      
      const deltaValue = delta ? parseInt(delta) : 0;

      if (changeType === 'delegation') {
        // Delegation event - sourceAccountId is delegatorAccountId
        if (deltaValue > 0) {
          notificationMessage = `🥳 You've received a new delegation in ${daoId}!\n${sourceAccountId} delegated to you, increasing your voting power by ${this.formatVoteDelta(deltaValue)}.`;
        } else if (deltaValue < 0) {
          notificationMessage = `🥺 A delegator just undelegated in ${daoId}!\n${sourceAccountId} removed their delegation, reducing your voting power by ${this.formatVoteDelta(deltaValue)}.`;
        } else {
          notificationMessage = `🔄 Delegation activity detected in ${daoId}!\n${sourceAccountId} modified their delegation to you.`;
        }
      } else if (changeType === 'transfer') {
        // Transfer event - check who caused the change based on delta
        if (deltaValue > 0) {
          // Received tokens - sourceAccountId is fromAccountId (who sent)
          notificationMessage = `💰 You've received new tokens in ${daoId}!\n${sourceAccountId} transferred tokens to you, increasing your voting power by ${this.formatVoteDelta(deltaValue)}.`;
        } else if (deltaValue < 0) {
          // Sent tokens - targetAccountId is toAccountId (who received)  
          notificationMessage = `📤 You've transferred tokens in ${daoId}!\nYou sent tokens to ${targetAccountId}, reducing your voting power by ${this.formatVoteDelta(deltaValue)}.`;
        } else {
          notificationMessage = `🔄 Token transfer activity detected in ${daoId}!\nTransfer completed with no voting power change.`;
        }
      } else {
        // Generic voting power change
        if (deltaValue !== 0) {
          notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power updated by ${this.formatVoteDelta(deltaValue)}.`;
        } else {
          notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power activity detected.`;
        }
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