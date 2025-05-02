/**
 * Interfaces related to subscription handling in the notification system.
 * These interfaces define the contract for subscription-related operations.
 */

import { IUserRepository, IPreferenceRepository } from './repository.interface';

/**
 * Logger interface for error handling and logging
 */
export interface Logger {
  error: (msg: string) => void;
}

/**
 * Parameters required for handling a subscription request
 */
export interface SubscriptionParams {
  userRepo: IUserRepository;
  prefRepo: IPreferenceRepository;
  dao: string;
  channel: string;
  channel_user_id: string;
  is_active: boolean;
  log: Logger;
} 