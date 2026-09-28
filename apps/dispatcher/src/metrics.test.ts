import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fastify, { type FastifyInstance } from 'fastify';
import { registerMetrics } from './metrics';

describe('registerMetrics', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = fastify();
    registerMetrics(server);
    server.get('/health', () => ({ status: 'ok' }));
    server.get('/items/:id', () => ({ ok: true }));
    server.get('/boom', () => {
      throw new Error('boom');
    });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('serves Prometheus text at /metrics', async () => {
    const res = await server.inject({ method: 'GET', url: '/metrics' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
  });

  it('records requests by route pattern and status, skipping /health and /metrics', async () => {
    await server.inject({ method: 'GET', url: '/items/42' });
    await server.inject({ method: 'GET', url: '/boom' });
    await server.inject({ method: 'GET', url: '/health' });
    await server.inject({ method: 'GET', url: '/nope' });

    const body = (await server.inject({ method: 'GET', url: '/metrics' })).body;
    const samples = body.split('\n').filter((l) => l.startsWith('http_server_request_duration_seconds_count'));

    expect(samples.some((l) => l.includes('http_route="/items/:id"') && l.includes('http_response_status_code="200"'))).toBe(true);
    expect(samples.some((l) => l.includes('http_route="/boom"') && l.includes('http_response_status_code="500"'))).toBe(true);
    expect(samples.some((l) => l.includes('http_route="unmatched"') && l.includes('http_response_status_code="404"'))).toBe(true);
    expect(samples.some((l) => l.includes('http_route="/health"'))).toBe(false);
    expect(samples.some((l) => l.includes('http_route="/metrics"'))).toBe(false);
    expect(samples.some((l) => l.includes('http_route="/items/42"'))).toBe(false);
  });
});
