// p-retry v4 options (doesn't export Options type)
export const RETRY_OPTIONS = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
  randomize: true,
  onFailedAttempt: (error: any) => {
    console.log(`AnticaptureClient retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left. Error: ${error.name}`);
  }
};

// Test configuration with no retries to speed up tests
export const TEST_RETRY_OPTIONS = {
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

const isNetworkError = (error: any): boolean => 
  error.code && RETRYABLE_NETWORK_CODES.has(error.code);

const isAxiosNetworkError = (error: any): boolean => 
  error.isAxiosError && !error.response;

const isServerError = (error: any): boolean => 
  error.response?.status >= 500;

export function isRetryableError(error: Error): boolean {
  const axiosError = error as any;
  
  return isNetworkError(axiosError) || 
         isAxiosNetworkError(axiosError) || 
         isServerError(axiosError);
}