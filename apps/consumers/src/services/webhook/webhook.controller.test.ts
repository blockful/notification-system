import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { WebhookController, WebhookRegistrar } from './webhook.controller';

describe('WebhookController URL validation', () => {
  let server: FastifyInstance;
  const registered: string[] = [];

  beforeEach(async () => {
    const service: WebhookRegistrar = {
      registerWebhook: async (url) => { registered.push(url); return { created: true, secret: 's3cret' }; },
      deactivateWebhook: async () => true,
    };
    server = fastify();
    server.setValidatorCompiler(validatorCompiler);
    server.setSerializerCompiler(serializerCompiler);
    await new WebhookController(service, ['relayer.railway.internal']).register(server);
    registered.length = 0;
  });

  afterEach(async () => {
    await server.close();
  });

  it('accepts https URLs', async () => {
    const res = await server.inject({ method: 'POST', url: '/webhooks', payload: { url: 'https://example.com/hook' } });
    expect(res.statusCode).toBe(201);
    expect(registered).toEqual(['https://example.com/hook']);
  });

  it('accepts http URLs on an allowlisted private host', async () => {
    const url = 'http://relayer.railway.internal:3002/relay/webhook';
    const res = await server.inject({ method: 'POST', url: '/webhooks', payload: { url } });
    expect(res.statusCode).toBe(201);
    expect(registered).toEqual([url]);
  });

  it('rejects http URLs on a non-allowlisted railway.internal host', async () => {
    const res = await server.inject({ method: 'POST', url: '/webhooks', payload: { url: 'http://other.railway.internal/hook' } });
    expect(res.statusCode).toBe(400);
    expect(registered).toEqual([]);
  });

  it('rejects other http URLs', async () => {
    const res = await server.inject({ method: 'POST', url: '/webhooks', payload: { url: 'http://example.com/hook' } });
    expect(res.statusCode).toBe(400);
    expect(registered).toEqual([]);
  });

  it('rejects a lookalike host that only ends with railway.internal', async () => {
    const res = await server.inject({ method: 'POST', url: '/webhooks', payload: { url: 'http://evilrailway.internal/hook' } });
    expect(res.statusCode).toBe(400);
  });
});
