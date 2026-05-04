import {
  AnticaptureClient,
  FeedEventType,
  FeedRelevance
} from '@notification-system/anticapture-client';
import { createLogger, type Logger } from '@anticapture/observability';

interface CacheEntry {
  value: string;
  fetchedAt: number;
}

const ONE_DAY_MS = 86_400_000;

export class ThresholdRepository {
  private cache = new Map<string, CacheEntry>();
  private readonly logger: Logger;

  constructor(
    private readonly anticaptureClient: AnticaptureClient,
    private readonly cacheTtlMs: number = ONE_DAY_MS,
    logger: Logger = createLogger('logic-system'),
  ) {
    this.logger = logger.child({ component: 'ThresholdRepository' });
  }

  async getThreshold(daoId: string, type: FeedEventType): Promise<string | null> {
    const cacheKey = `${daoId}:${type}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached.value;
    }

    try {
      const threshold = await this.anticaptureClient.getEventThreshold(daoId, type, FeedRelevance.High);

      if (threshold !== null) {
        this.cache.set(cacheKey, { value: threshold, fetchedAt: Date.now() });
      }

      return threshold;
    } catch (error) {
      this.logger.warn(
        { err: error, daoId, type, event: 'threshold.fetch_failed' },
        'error fetching threshold',
      );
      return null;
    }
  }
}
