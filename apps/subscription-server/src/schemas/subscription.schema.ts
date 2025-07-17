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
  is_active: z.boolean().optional().default(true).describe('Whether the subscription is active')
});

/**
 * Schema for subscription querystring parameters
 * Validates optional query parameters for subscription endpoints
 */
export const subscriptionQuerystringSchema = z.object({
  proposal_timestamp: z.string().optional()
    .transform((val) => {
      if (!val) return undefined;
      
      // If it's a unix timestamp (only digits), convert to ISO string
      if (/^\d+$/.test(val)) {
        const timestampNum = parseInt(val, 10);
        return new Date(timestampNum * 1000).toISOString();
      }
      
      // If it's already an ISO string or other format, keep as is
      return val;
    })
    .describe('Optional timestamp to filter subscribers by subscription date')
});

/**
 * Schema for create/update subscription response
 * Defines the structure and validation for success and error responses
 * when creating or updating a user subscription
 */
export const createUpdateSubscriptionResponseSchema = {
  200: z.object({
    user_id: z.string(),
    dao_id: z.string(),
    is_active: z.boolean(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
  }).describe('Subscription DTO')
};

/**
 * Schema for get DAO subscribers response
 * Defines the structure and validation for the subscribers list response
 */
export const getDaoSubscribersResponseSchema = {
  200: z.array(z.object({
    id: z.string(),
    channel: z.string(),
    channel_user_id: z.string(),
    created_at: z.string().optional()
  }).describe('User DTO'))
};