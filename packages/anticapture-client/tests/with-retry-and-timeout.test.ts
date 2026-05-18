import { describe, it, expect, vi } from 'vitest';
import { withRetryAndTimeout } from '../src/with-retry-and-timeout';

describe('withRetryAndTimeout', () => {
  it('returns the result on first success', async () => {
    const fn = vi.fn<() => Promise<number>>().mockResolvedValue(42);
    const result = await withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000 });
    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on network/server errors and eventually succeeds', async () => {
    const fn = vi.fn<() => Promise<string>>()
      .mockRejectedValueOnce(Object.assign(new Error('500'), { status: 500 }))
      .mockRejectedValueOnce(Object.assign(new Error('502'), { status: 502 }))
      .mockResolvedValue('ok');
    const result = await withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(
      Object.assign(new Error('400'), { status: 400 })
    );
    await expect(withRetryAndTimeout(fn, { retries: 4, timeoutMs: 1000 }))
      .rejects.toThrow('400');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(
      Object.assign(new Error('500'), { status: 500 })
    );
    await expect(withRetryAndTimeout(fn, { retries: 2, timeoutMs: 1000, baseDelayMs: 1 }))
      .rejects.toThrow('500');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('aborts and throws on timeout when no retries left', async () => {
    const fn = vi.fn((signal?: AbortSignal) => new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    await expect(withRetryAndTimeout(fn, { retries: 0, timeoutMs: 10 }))
      .rejects.toThrow();
  });

  it('retries on timeout and eventually succeeds', async () => {
    let attempts = 0;
    const fn = vi.fn((signal?: AbortSignal) => new Promise<string>((resolve, reject) => {
      attempts += 1;
      if (attempts < 3) {
        signal?.addEventListener('abort', () => reject(new Error('aborted')));
        return;
      }
      resolve('ok');
    }));
    const result = await withRetryAndTimeout(fn, { retries: 4, timeoutMs: 10, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
