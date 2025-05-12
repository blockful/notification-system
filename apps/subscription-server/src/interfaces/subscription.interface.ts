/**
 * Interfaces related to subscription handling in the notification system.
 * These interfaces define the contract for subscription-related operations.
 */

import { IUserRepository, IPreferenceRepository } from './user_subscription.interface';

/**
 * Logger interface for error handling and logging
 */
export interface Logger {
  error: (msg: string) => void;
}

/**
 * Interface for subscription-related parameters
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

/**
 * Interface for the parameters required to get DAO subscribers
 */
export interface GetDaoSubscribersParams {
  prefRepo: IPreferenceRepository;
  daoId: string;
} 