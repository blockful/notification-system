import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionService } from '../services/subscription.service';
import { z } from 'zod';

/**
 * Schema for user address URL parameters
 */
const userAddressParamsSchema = z.object({
  userId: z.string().describe('The user ID'),
  address: z.string().optional().describe('The wallet address')
});

/**
 * Schema for user address query parameters
 */
const userAddressQuerySchema = z.object({
  channel: z.string().describe('The notification channel (e.g., telegram, email)')
});

/**
 * Schema for add address request body
 */
const addAddressBodySchema = z.object({
  address: z.string().describe('The wallet address to add'),
  channel: z.string().describe('The notification channel (e.g., telegram, email)')
});

/**
 * Schema for batch addresses request body
 */
const batchAddressesBodySchema = z.object({
  addresses: z.array(z.string()).describe('Array of wallet addresses')
});

/**
 * Schema for user address response
 */
const userAddressResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  address: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

/**
 * Controller for user address endpoints
 */
export class UserAddressController {
  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * Registers all user address routes
   * @param fastify - The Fastify instance
   */
  async register(fastify: FastifyInstance): Promise<void> {
    // Add wallet address to user
    fastify.post<{
      Params: z.infer<typeof userAddressParamsSchema>;
      Body: z.infer<typeof addAddressBodySchema>;
    }>('/users/:userId/addresses', {
      schema: {
        description: 'Add a wallet address to a user',
        params: userAddressParamsSchema,
        body: addAddressBodySchema,
        response: {
          200: userAddressResponseSchema
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId: string };
      const { address, channel } = request.body as { address: string; channel: string };
      
      try {
        const userAddress = await this.subscriptionService.addUserAddress(userId, address, channel);
        return reply.send(userAddress);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    });

    // Remove wallet address from user
    fastify.delete<{
      Params: z.infer<typeof userAddressParamsSchema>;
      Querystring: z.infer<typeof userAddressQuerySchema>;
    }>('/users/:userId/addresses/:address', {
      schema: {
        description: 'Remove a wallet address from a user',
        params: userAddressParamsSchema,
        querystring: userAddressQuerySchema,
        response: {
          200: userAddressResponseSchema
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId, address } = request.params as { userId: string; address: string };
      const { channel } = request.query as { channel: string };
      
      try {
        const userAddress = await this.subscriptionService.removeUserAddress(userId, address, channel);
        return reply.send(userAddress);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    });

    // Get all wallet addresses for a user
    fastify.get<{
      Params: z.infer<typeof userAddressParamsSchema>;
      Querystring: z.infer<typeof userAddressQuerySchema>;
    }>('/users/:userId/addresses', {
      schema: {
        description: 'Get all wallet addresses for a user',
        params: userAddressParamsSchema,
        querystring: userAddressQuerySchema,
        response: {
          200: z.array(userAddressResponseSchema)
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = request.params as { userId: string };
      const { channel } = request.query as { channel: string };
      
      try {
        const addresses = await this.subscriptionService.getUserAddresses(userId, channel);
        return reply.send(addresses);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    });

    // Get users who own a specific wallet address
    fastify.get<{
      Params: { address: string };
    }>('/users/by-address/:address', {
      schema: {
        description: 'Get users who own a specific wallet address',
        params: z.object({
          address: z.string().describe('The wallet address')
        }),
        response: {
          200: z.array(z.object({
            id: z.string(),
            channel: z.string(),
            channel_user_id: z.string(),
            created_at: z.string(),
            token: z.string().optional()
          }))
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { address } = request.params as { address: string };
      
      try {
        const users = await this.subscriptionService.getUsersByWalletAddress(address);
        return reply.send(users);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    });

    // Get users who own specific wallet addresses (batch)
    fastify.post<{
      Body: z.infer<typeof batchAddressesBodySchema>;
    }>('/users/by-addresses/batch', {
      schema: {
        description: 'Get users who own specific wallet addresses (batch operation)',
        body: batchAddressesBodySchema,
        response: {
          200: z.record(z.string(), z.array(z.object({
            id: z.string(),
            channel: z.string(),
            channel_user_id: z.string(),
            created_at: z.string(),
            token: z.string().optional()
          })))
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      const { addresses } = request.body as { addresses: string[] };
      
      try {
        const result = await this.subscriptionService.getUsersByWalletAddressesBatch(addresses);
        return reply.send(result);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message });
      }
    });
  }
}