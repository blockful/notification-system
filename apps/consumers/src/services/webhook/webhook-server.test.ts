import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebhookServer } from './webhook-server';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

describe('WebhookServer docs', () => {
  let webhookServer: WebhookServer;
  let server: any;

  beforeEach(() => {
    const webhookController = new WebhookController({} as WebhookService);
    webhookServer = new WebhookServer(webhookController);
    server = (webhookServer as any).server;
  });

  afterEach(async () => {
    await webhookServer.stop();
  });

  it('serves an OpenAPI document listing the /webhooks path', async () => {
    const response = await server.inject({ method: 'GET', url: '/docs/json' });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.paths).toHaveProperty('/webhooks');
    expect(body.paths['/webhooks']).toHaveProperty('post');
    expect(body.paths['/webhooks']).toHaveProperty('delete');
  });

  it('serves the Swagger UI', async () => {
    const response = await server.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });
});
