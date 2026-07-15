import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { WebhookService } from './webhook.service';

const webhookBodySchema = z.object({
  url: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Webhook URL must use HTTPS',
  }),
});

const VERIFICATION_RECIPE = `Deliveries are signed with HMAC-SHA256: HMAC-SHA256(\`\${timestamp}.\${rawBody}\`, secret), ` +
  'sent as the `X-Webhook-Timestamp` header (unix seconds) and the `X-Webhook-Signature` header ' +
  '(`sha256=<hex>`). Receivers should recompute the signature and compare it using a timing-safe ' +
  'comparison (`crypto.timingSafeEqual`), and reject requests where the timestamp is more than 5 ' +
  'minutes old to prevent replay attacks.';

export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  async register(app: FastifyInstance): Promise<void> {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();
    typedApp.post('/webhooks', {
      schema: {
        tags: ['webhooks'],
        description: 'Registers a webhook URL to receive notifications for all DAOs. On first ' +
          'registration, returns a one-time HMAC secret used to verify delivery signatures — it is ' +
          'never shown again, so store it immediately. Re-registering an already-active webhook ' +
          `returns success without a secret.\n\n${VERIFICATION_RECIPE}`,
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
      schema: {
        tags: ['webhooks'],
        description: 'Deactivates a previously registered webhook URL, stopping further deliveries.',
        body: webhookBodySchema,
        response: {
          200: z.object({ success: z.literal(true) }),
          404: z.object({ error: z.string() }),
        },
      },
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
