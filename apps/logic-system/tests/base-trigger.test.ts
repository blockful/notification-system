import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { MockedFunction } from 'jest-mock';
import { Trigger } from '../src/triggers/base-trigger';

// Mock implementation of Trigger for testing
class MockTrigger extends Trigger<any> {
  fetchData: MockedFunction<() => Promise<any[]>>;
  process: MockedFunction<() => Promise<void>>;

  constructor(id: string = 'test-trigger', interval: number = 1000) {
    super(id, interval);
    this.fetchData = jest.fn<() => Promise<any[]>>();
    this.process = jest.fn<() => Promise<void>>();
  }

  // Expose private methods for testing
  getConsecutiveFailures() {
    return (this as any).consecutiveFailures;
  }
}

describe('BaseTrigger - Retry Logic', () => {
  let trigger: MockTrigger;
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    trigger = new MockTrigger('test-trigger', 100); // Use 100ms interval for faster tests
    jest.useFakeTimers();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    trigger.stop();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Retry with consecutive failures', () => {
    it('should continue running after 3 consecutive failures', async () => {
      trigger.fetchData.mockRejectedValue(new Error('Test error'));

      trigger.start();

      // Simulate 3 failures
      for (let i = 1; i <= 3; i++) {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      }

      expect(trigger.fetchData).toHaveBeenCalledTimes(3);
      expect(trigger.getConsecutiveFailures()).toBe(3);

      // Trigger should still be running (timer not null)
      expect((trigger as any).timer).not.toBeNull();
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
      jest.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      expect(trigger.getConsecutiveFailures()).toBe(1);

      // Second failure
      jest.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process
      expect(trigger.getConsecutiveFailures()).toBe(2);

      // Third attempt succeeds
      jest.advanceTimersByTime(100);
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
        jest.advanceTimersByTime(100);
        await Promise.resolve(); //fetchData
        await Promise.resolve(); //process
      }

      expect(trigger.fetchData).toHaveBeenCalledTimes(5);
      expect(trigger.getConsecutiveFailures()).toBe(5);
      
      // Timer should be null (trigger stopped)
      expect((trigger as any).timer).toBeNull();

      // Advancing time should not trigger more calls
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      expect(trigger.fetchData).toHaveBeenCalledTimes(5); // Still 5, no new calls
    });
  });

  describe('Timer cleanup', () => {
    it('should properly clean up timer when stop() is called', async () => {
      trigger.fetchData.mockResolvedValue([]);
      trigger.process.mockResolvedValue(undefined);

      trigger.start();
      expect((trigger as any).timer).not.toBeNull();

      await trigger.stop();

      // Should not make any calls after stop
      jest.advanceTimersByTime(100);
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

      jest.advanceTimersByTime(100);
      await Promise.resolve(); //fetchData
      await Promise.resolve(); //process

      expect(trigger.fetchData).toHaveBeenCalled();
      expect(trigger.process).toHaveBeenCalledWith(mockData, undefined);
      expect(trigger.getConsecutiveFailures()).toBe(1);
      
      // Trigger should still be running
      expect((trigger as any).timer).not.toBeNull();
    });
  });
});