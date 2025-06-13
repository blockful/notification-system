/**
 * Interfaces for the subscription API
 * Defines the structure for communication with the subscription server
 */

/**
 * Response interface for user subscription data
 * Provides a clear structure for subscription information in API responses
 */
export interface UserSubscriptionResponse {
  user_id: string;
  dao_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response interface for user data
 * Provides a clear structure for user information in API responses
 */
export interface UserResponse {
  id: string;
  channel: string;
  channel_user_id: string;
  created_at?: string;
} 