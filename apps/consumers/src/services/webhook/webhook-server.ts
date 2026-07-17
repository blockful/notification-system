import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler, jsonSchemaTransform, ZodTypeProvider } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import { WebhookController } from './webhook.controller';
import { createLogger, type Logger } from '@anticapture/observability';

export class WebhookServer {
  private server: FastifyInstance;
  private readonly logger: Logger;

  constructor(
    private webhookController: WebhookController,
    logger: Logger = createLogger('consumers'),
  ) {
    this.server = fastify();

    this.server.setValidatorCompiler(validatorCompiler);
    this.server.setSerializerCompiler(serializerCompiler);
    this.server.register(fastifyCors, { origin: '*' });

    this.server.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'Webhook Notification API',
          description: 'API for registering and managing webhook notification subscriptions',
          version: '1.0.0',
        }
      },
      transform: jsonSchemaTransform
    });

    this.server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });

    this.server.register((app) => this.webhookController.register(app));
    this.server.withTypeProvider<ZodTypeProvider>().get('/health', {
      schema: {
        tags: ['health'],
        response: { 200: z.object({ status: z.string(), timestamp: z.string() }) },
      },
    }, () => ({ status: 'ok', timestamp: new Date().toISOString() }));
    this.logger = logger.child({ component: 'WebhookServer' });
  }

  async start(port: number): Promise<void> {
    await this.server.listen({ port, host: '0.0.0.0' });
    this.logger.info({ port, event: 'webhook_server.started' }, 'webhook HTTP server running');
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}
