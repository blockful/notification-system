import { DispatcherMessage, MessageProcessingResult } from "../../interfaces/dispatcher-message.interface";
import { ISubscriptionClient, User } from "../../interfaces/subscription-client.interface";
import { NotificationClientFactory } from "../notification/notification-factory.service";
import { BaseTriggerHandler } from "./base-trigger.service";
import { formatTokenAmount } from "../../lib/number-formatter";
import { votingPowerMessages, replacePlaceholders, buildButtons } from '@notification-system/messages';
import crypto from 'crypto';
import { zeroAddress } from 'viem';

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
    // Step 1: Collect all unique account IDs and DAOs upfront
    const validEvents = message.events.filter(event => 
      event.daoId && event.accountId && event.transactionHash
    );
    
    if (validEvents.length === 0) {
      return {
        messageId: message.triggerId,
        timestamp: new Date().toISOString()
      };
    }

    // Get unique account IDs to batch wallet owners lookup (including sourceAccountIds for delegation notifications)
    const allAccountIds = [
      ...validEvents.map(event => event.accountId), // who receives voting power changes
      ...validEvents.map(event => event.sourceAccountId).filter(Boolean) // who delegates
    ];
    const uniqueAccountIds = [...new Set(allAccountIds)];
    const walletOwnersMap = await this.subscriptionClient.getWalletOwnersBatch(uniqueAccountIds);

    // Group events by DAO to batch DAO subscribers lookup
    const eventsByDao: Record<string, typeof validEvents> = {};
    validEvents.forEach(event => {
      if (!eventsByDao[event.daoId]) {
        eventsByDao[event.daoId] = [];
      }
      eventsByDao[event.daoId].push(event);
    });

    // Batch get DAO subscribers for all DAOs
    const daoSubscribersPromises = Object.keys(eventsByDao).map(async daoId => {
      const daoEvents = eventsByDao[daoId];
      const timestamp = daoEvents[0]?.timestamp; // Use first event's timestamp
      const subscribers = await this.subscriptionClient.getDaoSubscribers(daoId, timestamp);
      return { daoId, subscribers };
    });
    const daoSubscriberResults = await Promise.all(daoSubscribersPromises);
    const daoSubscribersMap = Object.fromEntries(
      daoSubscriberResults.map(result => [result.daoId, result.subscribers])
    );

    // Now process each event with cached data
    for (const votingPowerEvent of validEvents) {
      const { changeType, accountId, sourceAccountId } = votingPowerEvent;
      if (changeType === 'delegation') {
        const isSelfDelegation = sourceAccountId === accountId;
        
        if (!isSelfDelegation) {
          await this.processDelegationReceivedNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
        }
        await this.processDelegationSentNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
      } else {
        await this.processOtherVotingPowerNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
      }
    }
    
    return {
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process delegation received notification
   */
  private async processDelegationReceivedNotification(
    votingPowerEvent: any,
    walletOwnersMap: Record<string, User[]>,
    daoSubscribersMap: Record<string, User[]>
  ): Promise<void> {
    const { daoId, accountId, sourceAccountId, delta, transactionHash, chainId, votingPower } = votingPowerEvent;
    
    const subscribers = await this.getNotificationSubscribers(
      accountId, // who receives the delegation
      daoId,
      transactionHash,
      walletOwnersMap,
      daoSubscribersMap
    );
    
    if (subscribers.length === 0) return;
    
    const deltaValue = delta ? parseInt(delta) : 0;
    const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
    const formattedVotingPower = votingPower ? formatTokenAmount(parseInt(votingPower)) : '0';
    
    const messageTemplate = deltaValue >= 0
      ? votingPowerMessages.delegationReceived.new
      : votingPowerMessages.delegationReceived.removed;

    const notificationMessage = replacePlaceholders(messageTemplate, {
      daoId,
      delta: formattedDelta,
      votingPower: formattedVotingPower
    });

    const metadata = this.buildNotificationMetadata(chainId, transactionHash, {
      address: accountId,
      delegator: sourceAccountId
    });

    // Build buttons for delegation change
    const buttons = buildButtons({
      triggerType: 'delegationChange',
      txHash: transactionHash,
      chainId
    });

    await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata, buttons);
  }

  /**
   * Process delegation sent notification
   */
  private async processDelegationSentNotification(
    votingPowerEvent: any,
    walletOwnersMap: Record<string, User[]>,
    daoSubscribersMap: Record<string, User[]>
  ): Promise<void> {
    const { daoId, accountId, sourceAccountId, targetAccountId, delta, transactionHash, chainId, previousDelegate, newDelegate } = votingPowerEvent;
    
    // Skip if sourceAccountId is not present
    if (!sourceAccountId) {
      return;
    }

    // Skip self-delegation notifications
    if (sourceAccountId === accountId) {
      return;
    }
    
    const subscribers = await this.getNotificationSubscribers(
      sourceAccountId, // who MADE the delegation
      daoId,
      transactionHash,
      walletOwnersMap,
      daoSubscribersMap
    );
    
    if (subscribers.length === 0) {
      return;
    }
    
    const deltaValue = delta ? parseInt(delta) : 0;
    const formattedDelta = formatTokenAmount(Math.abs(deltaValue));

    // Determine delegation type based on previousDelegate and newDelegate
    const isPreviousZero = !previousDelegate || previousDelegate === zeroAddress;
    const isNewZero = !newDelegate || newDelegate === zeroAddress;

    let messageTemplate: string;
    let placeholders: Record<string, string>;

    if (isPreviousZero && !isNewZero) {
      // New delegation: was 0x0, now delegates to someone
      messageTemplate = votingPowerMessages.delegationSent.new;
      placeholders = {
        daoId,
        delta: formattedDelta
      };
    } else if (!isPreviousZero && !isNewZero) {
      // Changed delegation: had a delegate, now delegates to someone else
      messageTemplate = votingPowerMessages.delegationSent.changed;
      placeholders = {
        daoId
      };
    } else {
      // Undelegation: had a delegate, now 0x0
      messageTemplate = votingPowerMessages.delegationSent.removed;
      placeholders = {
        daoId
      };
    }

    const notificationMessage = replacePlaceholders(messageTemplate, placeholders);

    const metadata = this.buildNotificationMetadata(chainId, transactionHash, {
      delegatorAccount: sourceAccountId,
      delegate: newDelegate || targetAccountId || accountId,
      previousDelegate: previousDelegate || undefined
    });

    // Build buttons for delegation change
    const buttons = buildButtons({
      triggerType: 'delegationChange',
      txHash: transactionHash,
      chainId
    });

    await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata, buttons);
  }

  /**
   * Process other voting power notifications (transfer, other types)
   */
  private async processOtherVotingPowerNotification(
    votingPowerEvent: any,
    walletOwnersMap: Record<string, User[]>,
    daoSubscribersMap: Record<string, User[]>
  ): Promise<void> {
    const { daoId, accountId, changeType, transactionHash, chainId, transfer } = votingPowerEvent;
    
    const subscribers = await this.getNotificationSubscribers(
      accountId, daoId, transactionHash, walletOwnersMap, daoSubscribersMap
    );
    if (subscribers.length === 0) return;

    const { message, metadata } = changeType === 'transfer'
      ? this.buildTransferTypeNotification(votingPowerEvent)
      : this.buildGenericNotification(votingPowerEvent);

    const buttons = buildButtons({ triggerType: 'votingPowerChange', txHash: transactionHash, chainId });
    await this.sendNotificationsToSubscribers(subscribers, message, transactionHash, daoId, metadata, buttons);
  }

  /**
   * Build notification for transfer type - uses delegator balance change notification
   */
  private buildTransferTypeNotification(event: any): { message: string; metadata: any } {
    const { daoId, accountId, delta, chainId, transactionHash, votingPower, transfer } = event;
    const deltaValue = delta ? parseInt(delta) : 0;
    const isPositive = deltaValue >= 0;
    const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
    const formattedVotingPower = votingPower ? formatTokenAmount(parseInt(votingPower)) : '0';
    const delegatorAccountId = isPositive ? transfer?.toAccountId : transfer?.fromAccountId;

    const message = replacePlaceholders(
      votingPowerMessages.delegatorBalanceChange[isPositive ? 'increased' : 'decreased'],
      { daoId, delta: formattedDelta, votingPower: formattedVotingPower }
    );

    return {
      message,
      metadata: this.buildNotificationMetadata(chainId, transactionHash, { 
        address: accountId,
        delegator: delegatorAccountId || accountId 
      })
    };
  }

  /**
   * Build notification for generic voting power change
   */
  private buildGenericNotification(event: any): { message: string; metadata: any } {
    const { daoId, accountId, delta, chainId, transactionHash, votingPower } = event;
    const deltaValue = delta ? parseInt(delta) : 0;
    const isPositive = deltaValue >= 0;
    const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
    const formattedVotingPower = votingPower ? formatTokenAmount(parseInt(votingPower)) : '0';

    const message = replacePlaceholders(
      votingPowerMessages.generic[isPositive ? 'increased' : 'decreased'],
      { daoId, delta: formattedDelta, votingPower: formattedVotingPower }
    );

    return {
      message,
      metadata: this.buildNotificationMetadata(chainId, transactionHash, { address: accountId })
    };
  }

  /**
   * Shared method to get notification subscribers with deduplication
   */
  private async getNotificationSubscribers(
    accountId: string,
    daoId: string,
    transactionHash: string,
    walletOwnersMap: Record<string, User[]>,
    daoSubscribersMap: Record<string, User[]>
  ): Promise<User[]> {
    // Get wallet owners from cache
    const walletOwners = walletOwnersMap[accountId] || [];
    if (walletOwners.length === 0) return [];
    
    // Get DAO subscribers from cache
    const daoSubscribers = daoSubscribersMap[daoId] || [];
    
    // Filter wallet owners to only include those subscribed to this DAO
    const subscribedOwners = walletOwners.filter(owner => 
      daoSubscribers.some(sub => sub.id === owner.id)
    );
    
    if (subscribedOwners.length === 0) return [];
    
    // Check deduplication for all subscribed owners at once
    const shouldSendNotifications = await this.subscriptionClient.shouldSend(
      subscribedOwners, 
      transactionHash, 
      daoId
    );
    
    // Final filtered list of subscribers
    const finalSubscribers = subscribedOwners.filter(owner => 
      shouldSendNotifications.some(notification => notification.user_id === owner.id)
    );
    return finalSubscribers;
  }

  /**
   * Shared method to build notification metadata
   */
  private buildNotificationMetadata(
    chainId?: number,
    transactionHash?: string,
    addresses?: Record<string, string>
  ): any {
    return {
      ...(chainId && transactionHash && {
        transaction: {
          hash: transactionHash,
          chainId: chainId
        }
      }),
      ...(addresses && { addresses })
    };
  }
}