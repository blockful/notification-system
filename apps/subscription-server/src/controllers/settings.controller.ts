import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { settingsParamsSchema, settingsBodySchema, settingsResponseSchema } from '../schemas/settings.schema';
import { SettingsHandler } from '../handlers/settings.handler';

export class SettingsController {
  constructor(private settingsHandler: SettingsHandler) {}

  async register(app: FastifyInstance) {
    const fastify = app.withTypeProvider<ZodTypeProvider>();

    fastify.get('/users/by-channel/:channel/:channelUserId/notification-preferences', {
      schema: {
        tags: ['settings'],
        description: 'Get notification preferences for a user',
        params: settingsParamsSchema,
        response: settingsResponseSchema,
      },
    }, async (request) => {
      const { channel, channelUserId } = request.params;
      return this.settingsHandler.getPreferences(channel, channelUserId);
    });

    fastify.post('/users/by-channel/:channel/:channelUserId/notification-preferences', {
      schema: {
        tags: ['settings'],
        description: 'Save notification preferences for a user',
        params: settingsParamsSchema,
        body: settingsBodySchema,
      },
    }, async (request, reply) => {
      const { channel, channelUserId } = request.params;
      const { preferences } = request.body;
      await this.settingsHandler.savePreferences(channel, channelUserId, preferences);
      return reply.status(204).send();
    });
  }
}
