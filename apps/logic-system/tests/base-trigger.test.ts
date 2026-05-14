import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Trigger } from '../src/triggers/base-trigger';

type TestData = { id: number };

/**
 * Concrete subclass with scriptable fetchData/process behavior.
 * - fetchDataQueue: FIFO of results (data array or Error) consumed by each call.
 * - fetchDataDefault: used when the queue is empty.
 */
class SimpleTrigger extends Trigger<TestData> {
  fetchDataQueue: (TestData[] | Error)[] = [];
  fetchDataDefault: TestData[] | Error = [];
  fetchDataCalls = 0;

  processedBatches: TestData[][] = [];
  processError?: Error;

  constructor(id: string = 'test-trigger', interval: number = 1000) {
    super(id, interval);
  }

  protected async fetchData(): Promise<TestData[]> {
    this.fetchDataCalls++;
    const next = this.fetchDataQueue.length > 0
      ? this.fetchDataQueue.shift()!
      : this.fetchDataDefault;
    if (next instanceof Error) throw next;
    return next;
  }

  async process(data: TestData[]): Promise<void> {
    this.processedBatches.push(data);
    if (this.processError) throw this.processError;
  }

  // Test-only accessors for protected state
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  getTimer(): NodeJS.Timeout | null {
    return this.timer;
  }
}

describe('BaseTrigger - Retry Logic', () => {
  let trigger: SimpleTrigger;

  beforeEach(() => {
    trigger = new SimpleTrigger('test-trigger', 100);
    vi.useFakeTimers();
  });

  afterEach(() => {
    trigger.stop();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Retry with consecutive failures', () => {
    it('should continue running after 3 consecutive failures', async () => {
      trigger.fetchDataDefault = new Error('Test error');

      trigger.start();

      for (let i = 1; i <= 3; i++) {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
      }

      expect(trigger.fetchDataCalls).toBe(3);
      expect(trigger.getConsecutiveFailures()).toBe(3);

      // Timer still active — trigger keeps running below the 5-failure ceiling
      expect(trigger.getTimer()).not.toBeNull();
    });
  });

  describe('Reset counter after success', () => {
    it('should reset consecutive failures counter after successful execution', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];

      trigger.fetchDataQueue = [
        new Error('Error 1'),
        new Error('Error 2'),
        mockData,
      ];

      trigger.start();

      // First failure
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      expect(trigger.getConsecutiveFailures()).toBe(1);

      // Second failure
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      expect(trigger.getConsecutiveFailures()).toBe(2);

      // Third attempt succeeds
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();

      expect(trigger.fetchDataCalls).toBe(3);
      expect(trigger.processedBatches).toEqual([mockData]);
      expect(trigger.getConsecutiveFailures()).toBe(0);
    });
  });

  describe('Stop after 5 consecutive failures', () => {
    it('should stop the trigger after 5 consecutive failures', async () => {
      trigger.fetchDataDefault = new Error('Persistent error');

      trigger.start();

      for (let i = 1; i <= 5; i++) {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
        await Promise.resolve();
      }

      expect(trigger.fetchDataCalls).toBe(5);
      expect(trigger.getConsecutiveFailures()).toBe(5);

      // Timer is null → trigger stopped after hitting the ceiling
      expect(trigger.getTimer()).toBeNull();

      // No further calls after stop
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(trigger.fetchDataCalls).toBe(5);
    });
  });

  describe('Timer cleanup', () => {
    it('should properly clean up timer when stop() is called', async () => {
      trigger.fetchDataDefault = [];

      trigger.start();
      expect(trigger.getTimer()).not.toBeNull();

      await trigger.stop();

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();
      expect(trigger.fetchDataCalls).toBe(0);
    });
  });

  describe('Error handling in process method', () => {
    it('should handle errors from process() method and increment failure counter', async () => {
      const mockData = [{ id: 1 }];
      trigger.fetchDataDefault = mockData;
      trigger.processError = new Error('Process error');

      trigger.start();

      vi.advanceTimersByTime(100);
      await Promise.resolve();
      await Promise.resolve();

      expect(trigger.fetchDataCalls).toBe(1);
      expect(trigger.processedBatches).toEqual([mockData]);
      expect(trigger.getConsecutiveFailures()).toBe(1);

      expect(trigger.getTimer()).not.toBeNull();
    });
  });
});
