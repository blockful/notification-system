import { type Options } from 'p-retry';
export declare const RETRY_OPTIONS: Options;
export declare const TEST_RETRY_OPTIONS: {
    retries: number;
    minTimeout: number;
    maxTimeout: number;
    randomize: boolean;
    onFailedAttempt: () => void;
};
export declare function isRetryableError(error: Error): boolean;
