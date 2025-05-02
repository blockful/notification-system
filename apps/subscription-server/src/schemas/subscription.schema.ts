/**
 * Subscription schemas module
 * Defines Zod schemas for request/response validation in subscription endpoints
 */

import { z } from "zod";

/**
 * Schema for subscription URL parameters
 * Validates the DAO identifier in the URL
 */
export const subscriptionParamsSchema = z.object({
  dao: z.string().describe('The DAO identifier')
});

/**
 * Schema for subscription request body
 * Validates the subscription request payload
 */
export const subscriptionBodySchema = z.object({
  channel: z.string().describe('The channel the user is coming from (e.g., "telegram", "discord")'),
  channel_user_id: z.string().describe('The user ID from the channel'),
  is_active: z.boolean().default(true).describe('Whether the subscription is active')
});

/**
 * Schema for create/update subscription response
 * Defines the structure and validation for success and error responses
 * when creating or updating a user subscription
 */
export const createUpdateSubscriptionResponseSchema = {
  200: z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      user_id: z.string(),
      dao_id: z.string(),
      is_active: z.boolean(),
      created_at: z.string().optional(),
      updated_at: z.string().optional()
    }).optional()
  }),
  500: z.object({
    success: z.boolean(),
    message: z.string(),
    error: z.string().optional()
  })
};

/**
 * Schema for the get DAO subscribers response
 * Defines the structure for the response when retrieving all users 
 * subscribed to a specific DAO
 */
export const getDaoSubscribersResponseSchema = {
  200: z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(z.object({
      id: z.string(),
      user_id: z.string(),
      channel: z.string(),
      channel_user_id: z.string(),
      is_active: z.boolean()
    }))
  }),
  500: z.object({
    success: z.boolean(),
    message: z.string(),
    error: z.string().optional()
  })
};