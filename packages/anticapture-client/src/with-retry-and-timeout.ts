export interface RetryOptions {
  retries: number;
  timeoutMs: number;
  baseDelayMs?: number; // default 1000
}

function isRetryable(err: unknown, timedOut: boolean): boolean {
  if (timedOut) return true;
  const e = err as { status?: number; code?: string };
  if (!e) return false;
  if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ENETUNREACH') return true;
  if (typeof e.status === 'number' && e.status >= 500) return true;
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetryAndTimeout<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { retries, timeoutMs, baseDelayMs = 1000 } = opts;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    const ac = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ac.abort(); }, timeoutMs);
    try {
      return await fn(ac.signal);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err, timedOut) || attempt === retries) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`[AnticaptureClient] Retry ${attempt + 1}/${retries} after ${timedOut ? 'timeout' : 'error'}: ${(err as Error).message}`);
      await sleep(delay);
      attempt += 1;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
