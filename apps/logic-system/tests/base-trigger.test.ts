import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { Trigger } from '../src/triggers/base-trigger';

type TestData = { id: number };

// Mock implementation of Trigger for testing
class MockTrigger extends Trigger<TestData> {
  fetchData: MockedFunction<() => Promise<TestData[]>>;
  process: MockedFunction<() => Promise<void>>;

  constructor(id: string = 'test-trigger', interval: number = 1000) {
    super(id, interval);
    this.fetchData = vi.fn<() => Promise<TestData[]>>();
    this.process = vi.fn<() => Promise<void>>();
  }

  // Expose protected fields for testing
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  getTimer(): NodeJS.Timeout | null {
    return this.timer;
  }
}

describe('BaseTrigger - Retry Logic', () => {
  let trigger: MockTrigger;

  beforeEach(() => {
    trigger = new MockTrigger('test-trigger', 100);
    vi.useFakeTimers();
  });

  afterEach(() => {
    trigger.stop();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Retry with consecutive failures', () => {
    it('should continue running after 3 consecutive failures', async () => {
      trigger.fetchData.mockRejectedValue(new Error('Test error'));

      trigger.start();

      // Simulate 3 failures
      for (let i = 1; i <= 3; i++) {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
      }

      expect(trigger.fetchData).toHaveBeenCalledTimes(3);
      expect(trigger.getConsecutiveFailures()).toBe(3);

      // Trigger should still be running (timer not null)
      expect(trigger.getTimer()).not.toBeNull();
    });
  });

  describe('Reset counter after success', () => {
    it('should reset consecutive failures counter after successful execution', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      
      // First 2 calls fail, third succeeds
      trigger.fetchData
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(mockData);

      trigger.process.mockResolvedValue(undefined);

      trigger.start();

      // First failure
      vi.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      expect(trigger.getConsecutiveFailures()).toBe(1);

      // Second failure
      vi.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      expect(trigger.getConsecutiveFailures()).toBe(2);

      // Third attempt succeeds
      vi.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      
      expect(trigger.fetchData).toHaveBeenCalledTimes(3);
      expect(trigger.process).toHaveBeenCalledWith(mockData, undefined);
      expect(trigger.getConsecutiveFailures()).toBe(0);
    });
  });

  describe('Stop after 5 consecutive failures', () => {
    it('should stop the trigger after 5 consecutive failures', async () => {
      trigger.fetchData.mockRejectedValue(new Error('Persistent error'));

      trigger.start();

      // Simulate 5 failures
      for (let i = 1; i <= 5; i++) {
        vi.advanceTimersByTime(100);
        await Promise.resolve(); //fetchData
        await Promise.resolve(); //process
      }

      expect(trigger.fetchData).toHaveBeenCalledTimes(5);
      expect(trigger.getConsecutiveFailures()).toBe(5);
      
      // Timer should be null (trigger stopped)
      expect(trigger.getTimer()).toBeNull();

      // Advancing time should not trigger more calls
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(trigger.fetchData).toHaveBeenCalledTimes(5); // Still 5, no new calls
    });
  });

  describe('Timer cleanup', () => {
    it('should properly clean up timer when stop() is called', async () => {
      trigger.fetchData.mockResolvedValue([]);
      trigger.process.mockResolvedValue(undefined);

      trigger.start();
      expect(trigger.getTimer()).not.toBeNull();

      await trigger.stop();

      // Should not make any calls after stop
      vi.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      expect(trigger.fetchData).not.toHaveBeenCalled();
    });
  });

  describe('Error handling in process method', () => {
    it('should handle errors from process() method and increment failure counter', async () => {
      const mockData = [{ id: 1 }];
      trigger.fetchData.mockResolvedValue(mockData);
      trigger.process.mockRejectedValue(new Error('Process error'));

      trigger.start();

      vi.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process

      expect(trigger.fetchData).toHaveBeenCalled();
      expect(trigger.process).toHaveBeenCalledWith(mockData, undefined);
      expect(trigger.getConsecutiveFailures()).toBe(1);
      
      // Trigger should still be running
      expect(trigger.getTimer()).not.toBeNull();
    });
  });
});