"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_RETRY_OPTIONS = exports.RETRY_OPTIONS = void 0;
exports.isRetryableError = isRetryableError;
// p-retry v4 options (doesn't export Options type)
exports.RETRY_OPTIONS = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 30000,
    randomize: true,
    onFailedAttempt: (error) => {
        console.log(`AnticaptureClient retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left. Error: ${error.name}`);
    }
};
// Test configuration with no retries to speed up tests
exports.TEST_RETRY_OPTIONS = {
    retries: 0,
    minTimeout: 0,
    maxTimeout: 0,
    randomize: false,
    onFailedAttempt: () => {
        // Silent in tests
    }
};
const RETRYABLE_NETWORK_CODES = new Set([
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ENETUNREACH'
]);
const isNetworkError = (error) => error.code && RETRYABLE_NETWORK_CODES.has(error.code);
const isAxiosNetworkError = (error) => error.isAxiosError && !error.response;
const isServerError = (error) => error.response?.status >= 500;
function isRetryableError(error) {
    const axiosError = error;
    return isNetworkError(axiosError) ||
        isAxiosNetworkError(axiosError) ||
        isServerError(axiosError);
}
