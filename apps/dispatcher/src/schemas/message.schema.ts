import { z } from "zod";

/**
 * Zod schema for validating incoming messages
 */
export const dispatcherMessageSchema = z.object({
  triggerId: z.string().min(1, "Trigger ID is required"),
  payload: z.any()
});

/**
 * Response schema for successful message processing
 */
export const successResponseSchema = z.object({
  messageId: z.string(),
  timestamp: z.string()
});

/**
 * Response schema for error responses
 */
export const errorResponseSchema = z.object({
  error: z.string()
}); 