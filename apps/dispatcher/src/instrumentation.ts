import { createObservabilityProvider } from '@anticapture/observability';

const observability = createObservabilityProvider('dispatcher');

export const exporter = observability.exporter;
