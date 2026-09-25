import { createObservabilityProvider } from '@anticapture/observability';

const observability = createObservabilityProvider('logic-system');

export const exporter = observability.exporter;
