import { z } from 'zod';

export const settingsParamsSchema = z.object({
  channel: z.string().describe('The notification channel (telegram or slack)'),
  channelUserId: z.string().describe('The user ID in the channel'),
});

export const settingsBodySchema = z.object({
  preferences: z.array(z.object({
    trigger_type: z.string().describe('The notification type ID'),
    is_active: z.boolean().describe('Whether this notification type is enabled'),
  })).describe('Array of notification preferences to save'),
});

export const settingsResponseSchema = {
  200: z.object({
    preferences: z.array(z.object({
      trigger_type: z.string(),
      is_active: z.boolean(),
    })),
  }).describe('User notification preferences'),
};
