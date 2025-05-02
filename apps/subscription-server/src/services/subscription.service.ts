/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { SubscriptionParams } from '../interfaces/subscription.interface';

/**
 * Constants for subscription-related messages
 */
export const SUBSCRIPTION_MESSAGES = {
  ERROR_QUERY_USER: 'Database query failed (users)',
  ERROR_CREATE_USER: 'Failed to create user',
  ERROR_QUERY_PREF: 'Database query failed (preferences)',
  ERROR_CREATE_PREF: 'Failed to create subscription',
  ERROR_UPDATE_PREF: 'Failed to update subscription',
  SUCCESS_NEW_SUB: 'New subscription created',
  SUCCESS_ALREADY: 'Subscription already in the requested state',
  SUCCESS_ACTIVATED: 'Subscription activated for user',
  SUCCESS_DEACTIVATED: 'Subscription deactivated for user',
};

/**
 * Handles subscription requests for users to DAOs
 * 
 * This function:
 * 1. Finds or creates a user based on their channel and channel_user_id
 * 2. Finds or creates a subscription preference for the user and DAO
 * 3. Updates the subscription state if necessary
 * 
 * @param {SubscriptionParams} params - The subscription request parameters
 * @returns {Promise<{user: User, result: UserPreference, message: string}>} The subscription result
 * @throws {Error} If any database operation fails
 */
export async function handleSubscription({
  userRepo,
  prefRepo,
  dao,
  channel,
  channel_user_id,
  is_active,
  log
}: SubscriptionParams) {
  try {
    let user = await userRepo.findByChannelAndId(channel, channel_user_id);
    
    if (!user) {
      user = await userRepo.create({
        channel,
        channel_user_id,
        is_active: true
      });
    }
    let existingPreference = await prefRepo.findByUserAndDao(user.id, dao);
    let result;
    let message;
    if (existingPreference) {
      if (existingPreference.is_active !== is_active) {
        result = await prefRepo.update(existingPreference.id, { is_active });
        message = is_active ? SUBSCRIPTION_MESSAGES.SUCCESS_ACTIVATED : SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED;
      } else {
        result = existingPreference;
        message = SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY;
      }
    } else {
      result = await prefRepo.create({
        user_id: user.id,
        dao_id: dao,
        is_active
      });
      message = SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB;
    }
    return {
      user,
      result,
      message
    };
  } catch (error: any) {
    log.error(`Error in subscription service: ${error.message}`);
    throw error;
  }
} 