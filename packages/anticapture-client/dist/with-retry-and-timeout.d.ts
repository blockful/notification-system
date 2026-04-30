export interface RetryOptions {
    retries: number;
    timeoutMs: number;
    baseDelayMs?: number;
}
export declare function withRetryAndTimeout<T>(fn: (signal?: AbortSignal) => Promise<T>, opts: RetryOptions): Promise<T>;
