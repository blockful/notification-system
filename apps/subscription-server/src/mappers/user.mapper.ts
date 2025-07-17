/**
 * User mapper module
 * Provides mapping functions to convert between domain entities and DTOs
 */

import { User, UserResponse } from '../interfaces';

/**
 * Maps a User domain entity to a UserResponse for API responses
 * @param user - The user domain entity to map
 * @returns The user response with properly formatted data
 */
export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  channel: user.channel,
  channel_user_id: user.channel_user_id,
  created_at: user.created_at
});