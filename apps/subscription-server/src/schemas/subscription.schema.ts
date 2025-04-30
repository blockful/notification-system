import { z } from "zod";

export const subscriptionParamsSchema = z.object({
  dao: z.string().describe('The DAO identifier')
});

export const subscriptionBodySchema = z.object({
  channel: z.string().describe('The channel the user is coming from (e.g., "telegram", "discord")'),
  channel_user_id: z.string().describe('The user ID from the channel'),
  is_active: z.boolean().default(true).describe('Whether the subscription is active')
});

export const subscriptionResponseSchema = {
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