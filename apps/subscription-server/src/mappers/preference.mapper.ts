/**
 * Preference mapper module
 * Provides mapping functions to convert between domain entities and DTOs
 */

import { UserPreference, UserSubscriptionResponse } from '../interfaces';

/**
 * Maps a UserPreference domain entity to a UserSubscriptionResponse for API responses
 * @param preference - The preference domain entity
 * @param daoId - The DAO ID for the subscription
 * @returns The subscription response with properly formatted data
 */
export const toSubscriptionResponse = (
  preference: UserPreference, 
  daoId?: string
): UserSubscriptionResponse => ({
  user_id: preference.user_id,
  dao_id: daoId || preference.dao_id,
  is_active: preference.is_active,
  created_at: preference.created_at,
  updated_at: preference.updated_at
}); 