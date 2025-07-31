export declare const RETRY_OPTIONS: {
    retries: number;
    factor: number;
    minTimeout: number;
    maxTimeout: number;
    randomize: boolean;
    onFailedAttempt: (error: any) => void;
};
export declare const TEST_RETRY_OPTIONS: {
    retries: number;
    minTimeout: number;
    maxTimeout: number;
    randomize: boolean;
    onFailedAttempt: () => void;
};
export declare function isRetryableError(error: Error): boolean;
