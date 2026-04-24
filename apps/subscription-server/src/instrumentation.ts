import { createObservabilityProvider } from '@anticapture/observability';

const observability = createObservabilityProvider('subscription-server');

export const exporter = observability.exporter;
