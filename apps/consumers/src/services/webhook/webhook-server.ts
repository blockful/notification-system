import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import { WebhookController } from './webhook.controller';

export class WebhookServer {
  private server: FastifyInstance;

  constructor(private webhookController: WebhookController) {
    this.server = fastify();

    this.server.setValidatorCompiler(validatorCompiler);
    this.server.setSerializerCompiler(serializerCompiler);
    this.server.register(fastifyCors, { origin: '*' });

    this.server.register((app) => this.webhookController.register(app));
  }

  async start(port: number): Promise<void> {
    await this.server.listen({ port, host: '0.0.0.0' });
    console.log(`Webhook HTTP server running on port ${port}`);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}
