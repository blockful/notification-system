import { metrics } from '@opentelemetry/api';
import type { FastifyInstance } from 'fastify';
import { collectPrometheusMetrics } from '@anticapture/observability';
import { exporter } from './instrumentation';

// Not recorded in the request histogram: the Prometheus scrape and the Railway
// health check would otherwise dominate the request rate of a low-traffic service.
const SKIP_PATHS = new Set(['/metrics', '/health']);

/**
 * Exposes Prometheus metrics at GET /metrics and records every other request in
 * `http_server_request_duration_seconds`.
 *
 * Same metric name, labels and buckets as the Anticapture services (gateful's
 * metricsMiddleware), so the shared Prometheus alerts (HighLatency,
 * HighErrorRate) and the Grafana "Notification System" row work unchanged.
 * The @anticapture/observability HTTP auto-instrumentation does not emit
 * request metrics (it is registered before the global meter provider is set),
 * hence the explicit histogram.
 */
export function registerMetrics(server: FastifyInstance): void {
  // Created here, not at module load, so the meter provider from
  // ./instrumentation is guaranteed to be the global one already.
  const httpRequestDuration = metrics.getMeter('http-server').createHistogram(
    'http_server_request_duration_seconds',
    {
      description: 'Duration of HTTP requests in seconds',
      advice: {
        explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      },
    },
  );

  server.get('/metrics', async (_req, reply) => {
    const { body, contentType } = await collectPrometheusMetrics(exporter);
    return reply.type(contentType).send(body);
  });

  server.addHook('onResponse', async (request, reply) => {
    // The route pattern (e.g. /users/:id), never the raw URL, keeps label
    // cardinality bounded; every unmatched request (404) shares one value.
    const route = request.routeOptions.url ?? 'unmatched';
    if (SKIP_PATHS.has(route)) return;

    httpRequestDuration.record(reply.elapsedTime / 1000, {
      http_request_method: request.method,
      http_route: route,
      http_response_status_code: reply.statusCode,
    });
  });
}
