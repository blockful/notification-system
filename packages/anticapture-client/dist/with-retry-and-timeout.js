"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetryAndTimeout = withRetryAndTimeout;
function isRetryable(err) {
    const e = err;
    if (!e)
        return false;
    if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.code === 'ENETUNREACH')
        return true;
    if (typeof e.status === 'number' && e.status >= 500)
        return true;
    return false;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withRetryAndTimeout(fn, opts) {
    const { retries, timeoutMs, baseDelayMs = 1000 } = opts;
    let attempt = 0;
    let lastErr;
    while (attempt <= retries) {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeoutMs);
        try {
            return await fn(ac.signal);
        }
        catch (err) {
            lastErr = err;
            if (!isRetryable(err) || attempt === retries)
                throw err;
            const delay = baseDelayMs * 2 ** attempt;
            console.warn(`[AnticaptureClient] Retry ${attempt + 1}/${retries} after error: ${err.message}`);
            await sleep(delay);
            attempt += 1;
        }
        finally {
            clearTimeout(timer);
        }
    }
    throw lastErr;
}
