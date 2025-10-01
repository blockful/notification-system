/**
 * Abstract base class for DAO management across different platforms.
 * Contains all platform-agnostic business logic for DAO subscriptions.
 * Platform-specific implementations handle only UI/interaction logic.
 */

import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from '../subscription-api.service';

export interface DAOSelectionState {
  selections: Set<string>;
  action?: 'subscribe' | 'unsubscribe';
}

export abstract class BaseDAOService {
  // DAO emojis mapping (shared across all platforms)
  protected readonly daoEmojis = new Map<string, string>([
    ['UNI', '🦄'],
    ['ENS', '🌐'],
    ['OP', '🔴'],
  ]);

  constructor(
    protected readonly anticaptureClient: AnticaptureClient,
    protected readonly subscriptionApi: SubscriptionAPIService
  ) {}

  /**
   * Abstract method to get the platform identifier
   * Each implementation must return its platform name
   */
  protected abstract getPlatformId(): string;

  /**
   * Get DAO display name with emoji
   */
  protected getDaoWithEmoji(dao: string): string {
    const normalizedDao = dao.toUpperCase();
    const emoji = this.daoEmojis.get(normalizedDao) || '🏛️';
    return `${emoji} ${dao}`;
  }

  /**
   * Fetch available DAOs from AntiCapture
   */
  protected async fetchAvailableDAOs(): Promise<any[]> {
    return await this.anticaptureClient.getDAOs();
  }

  /**
   * Get user's current DAO subscriptions
   */
  protected async getUserSubscriptions(userId: string): Promise<string[]> {
    const daos = await this.fetchAvailableDAOs();
    return await this.subscriptionApi.getUserPreferences(
      userId,
      this.getPlatformId(),
      daos.map(dao => dao.id)
    );
  }

  /**
   * Applies a specific subscription action (subscribe or unsubscribe) to selected DAOs
   * Used when user explicitly chooses to add OR remove DAOs
   */
  protected async applySubscriptionAction(
    userId: string,
    selectedDAOs: Set<string>,
    action: 'subscribe' | 'unsubscribe'
  ): Promise<void> {
    const platform = this.getPlatformId();

    if (action === 'subscribe') {
      // When subscribing, add selected DAOs
      const promises = Array.from(selectedDAOs).map(daoId =>
        this.subscriptionApi.saveUserPreference(daoId, userId, platform, true)
      );
      await Promise.all(promises);
    } else {
      // When unsubscribing, remove selected DAOs
      const promises = Array.from(selectedDAOs).map(daoId =>
        this.subscriptionApi.saveUserPreference(daoId, userId, platform, false)
      );
      await Promise.all(promises);
    }
  }

  /**
   * Synchronizes user's subscriptions to match the exact target state
   * Calculates and applies the minimal diff (adds missing, removes extra)
   * Used when user provides a complete desired state (e.g., checkbox UI)
   */
  protected async syncSubscriptionsToState(
    userId: string,
    targetState: Set<string>
  ): Promise<void> {
    const platform = this.getPlatformId();
    const daos = await this.fetchAvailableDAOs();
    const currentPreferences = await this.subscriptionApi.getUserPreferences(
      userId,
      platform,
      daos.map(dao => dao.id)
    );
    const currentSet = new Set(currentPreferences);

    // Find what to add and remove
    const toSubscribe = Array.from(targetState).filter(dao => !currentSet.has(dao));
    const toUnsubscribe = currentPreferences.filter(dao => !targetState.has(dao));

    // Execute updates in parallel
    const promises = [
      ...toSubscribe.map(daoId =>
        this.subscriptionApi.saveUserPreference(daoId, userId, platform, true)
      ),
      ...toUnsubscribe.map(daoId =>
        this.subscriptionApi.saveUserPreference(daoId, userId, platform, false)
      )
    ];

    await Promise.all(promises);
  }

  /**
   * Build a formatted list of DAOs for display
   */
  protected formatDAOList(daos: string[] | Set<string>): string {
    const daoArray = Array.isArray(daos) ? daos : Array.from(daos);
    return daoArray
      .map(dao => this.getDaoWithEmoji(dao))
      .join(', ');
  }

  /**
   * Build a formatted list with bullets for display
   */
  protected formatDAOListWithBullets(daos: string[] | Set<string>): string {
    const daoArray = Array.isArray(daos) ? daos : Array.from(daos);
    return daoArray
      .map(dao => `• ${this.getDaoWithEmoji(dao)}`)
      .join('\n');
  }

  // Abstract methods that must be implemented by platform-specific services
  abstract initialize(context: any, action?: 'subscribe' | 'unsubscribe'): Promise<void>;
  abstract listSubscriptions(context: any): Promise<void>;
  abstract toggle(context: any, daoName: string): Promise<void>;
  abstract confirm(context: any, action: 'subscribe' | 'unsubscribe'): Promise<void>;
}