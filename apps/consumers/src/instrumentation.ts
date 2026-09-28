import { createObservabilityProvider } from '@anticapture/observability';

const observability = createObservabilityProvider('consumers');

export const exporter = observability.exporter;
