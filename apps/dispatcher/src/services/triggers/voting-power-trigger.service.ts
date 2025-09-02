import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient, User } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { formatTokenAmount } from "../../lib/number-formatter";
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
    for (const votingPowerEvent of message.events) {
      const { daoId, accountId, votingPower, timestamp, delta, transactionHash, changeType, sourceAccountId, targetAccountId, chainId } = votingPowerEvent;
      
      if (!daoId || !accountId || !transactionHash) {
        continue;
      }

      // Get users who own this specific wallet address
      const walletOwners = await this.subscriptionClient.getWalletOwners(accountId);
      
      if (walletOwners.length === 0) {
        continue;
      }
      
      // Get all DAO subscribers once
      const daoSubscribers = await this.subscriptionClient.getDaoSubscribers(daoId, timestamp);
      
      // Filter wallet owners to only include those subscribed to this DAO
      const subscribedOwners = walletOwners.filter(owner => 
        daoSubscribers.some(sub => sub.id === owner.id)
      );
      
      if (subscribedOwners.length === 0) {
        continue;
      }
      
      // Check deduplication for all subscribed owners at once
      const shouldSendNotifications = await this.subscriptionClient.shouldSend(subscribedOwners, transactionHash, daoId);
      
      // Final filtered list of subscribers
      const subscribers = subscribedOwners.filter(owner => 
        shouldSendNotifications.some(notification => notification.user_id === owner.id)
      );
      
      let notificationMessage = '';
      let addressMetadata: { addresses?: Record<string, string> } | undefined;
      
      const deltaValue = delta ? parseInt(delta) : 0;
      const formattedDelta = formatTokenAmount(Math.abs(deltaValue));

      if (changeType === 'delegation') {
        if (deltaValue >= 0) {
          notificationMessage = `🥳 You've received a new delegation in ${daoId}!\n{{delegator}} delegated to you, increasing your voting power by ${formattedDelta}.`;
          addressMetadata = { addresses: { delegator: sourceAccountId } };
        } else if (deltaValue < 0) {
          notificationMessage = `🥺 A delegator just undelegated in ${daoId}!\n{{delegator}} removed their delegation, reducing your voting power by ${formattedDelta}.`;
          addressMetadata = { addresses: { delegator: sourceAccountId } };
        } 
      } else if (changeType === 'transfer') {
        if (deltaValue >= 0) {
          notificationMessage = `📈 Your voting power increased in ${daoId}!\nYou gained ${formattedDelta} voting power from token transfer activity.`;
        } else if (deltaValue < 0) {
          notificationMessage = `📉 Your voting power decreased in ${daoId}!\nYou lost ${formattedDelta} voting power from token transfer activity.`;
        } 
      } else {
        // Generic voting power change
        if (deltaValue !== 0) {
          notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power updated by ${formattedDelta}.`;
        } else {
          notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power activity detected.`;
        }
      }
      // Add transaction link placeholder
      notificationMessage += '\n\n{{txLink}}';
      
      // Prepare metadata with transaction info and addresses
      const metadata = {
        ...(chainId && {
          transaction: {
            hash: transactionHash,
            chainId: chainId
          }
        }),
        ...addressMetadata
      };
      
      await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata);
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }
}