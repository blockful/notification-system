/**
 * Zod schemas for notification endpoints
 * These schemas define the validation rules for request and response objects
 */

import { z } from 'zod';

// Request schema for sending notifications
export const NotificationRequestSchema = z.object({
  userId: z.string().optional(),
  channelUserId: z.string().min(1, 'Channel user ID is required'),
  message: z.string().min(1, 'Message content is required'),
  metadata: z.record(z.any()).optional()
});

// Notification response schema
export const NotificationResponseSchema = z.string().describe('Message ID of the sent notification');

// API error response schema
export const APIErrorResponseSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string()
});

// Health check response schema
export const HealthCheckResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string()
}); 