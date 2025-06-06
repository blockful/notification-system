/**
 * Notification schemas module
 * Defines Zod schemas for request/response validation in notification endpoints
 */

import { z } from "zod";

/**
 * Schema for notification item
 * Validates individual notification request
 */
export const notificationSchema = z.object({
  user_id: z.string().describe('The user ID'),
  event_id: z.string().describe('The event ID'),
  dao_id: z.string().describe('The DAO identifier')
});

/**
 * Schema for notification request body
 * Validates the array of notifications
 */
export const notificationBodySchema = z.object({
  notifications: z.array(notificationSchema).describe('Array of notifications')
});

/**
 * Schema for exclude-sent response
 * Defines the structure for filtered subscribers response
 */
export const excludeSentResponseSchema = {
  200: z.array(notificationSchema).describe('Filtered list of subscribers that should receive notifications')
}; 