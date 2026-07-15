import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { WebhookService } from './webhook.service';

const webhookBodySchema = z.object({
  url: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Webhook URL must use HTTPS',
  }),
});

export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  async register(app: FastifyInstance): Promise<void> {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();
    typedApp.post('/webhooks', {
      schema: {
        body: webhookBodySchema,
        response: {
          201: z.union([
            z.object({
              success: z.literal(true),
              secret: z.string(),
              note: z.string(),
            }),
            z.object({ success: z.literal(true) }),
          ]),
        },
      },
    }, async (request, reply) => {
      const { url } = request.body;
      const { created, secret } = await this.webhookService.registerWebhook(url);
      if (created) {
        return reply.code(201).send({
          success: true,
          secret,
          note: 'Store this secret now — it will not be shown again.',
        });
      }
      return reply.code(201).send({ success: true });
    });

    typedApp.delete('/webhooks', {
      schema: { body: webhookBodySchema },
    }, async (request, reply) => {
      const { url } = request.body;
      const found = await this.webhookService.deactivateWebhook(url);
      if (!found) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }
      return reply.code(200).send({ success: true });
    });
  }
}
