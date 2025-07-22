/**
 * @notice Configuration options for wait functions
 * @dev Options to control timing, retries, and error handling for async waiting operations
 */
export interface WaitForOptions {
  /// @notice Maximum time to wait in milliseconds (default: 10000ms)
  timeout?: number;
  /// @notice Initial interval between attempts in milliseconds (default: 100ms)
  interval?: number;
  /// @notice Whether to use exponential backoff (default: false)
  backoff?: boolean;
  /// @notice Maximum interval for exponential backoff in milliseconds (default: 1000ms)
  maxBackoffInterval?: number;
  /// @notice Callback function executed when timeout is reached
  onTimeout?: () => void | Promise<void>;
  /// @notice Custom error message for timeout failures
  errorMessage?: string;
}

/**
 * @notice Waits for a condition to return a truthy value
 * @dev Repeatedly executes condition function until it returns a truthy value or timeout
 * @param condition Function that returns the value to wait for (truthy values resolve the wait)
 * @param options Configuration options for timeout, interval, and backoff behavior
 * @return Promise that resolves with the condition result when truthy

 */
export async function waitFor<T>(
  condition: () => Promise<T> | T,
  options: WaitForOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    interval = 100,
    backoff = false,
    maxBackoffInterval = 1000,
    onTimeout,
    errorMessage
  } = options;

  const startTime = performance.now();
  let attempts = 0;
  let currentInterval = interval;
  let lastError: Error | undefined;

  while (performance.now() - startTime < timeout) {
    attempts++;
    
    try {
      const result = await condition();
      if (result !== false && result !== null && result !== undefined) {
        return result;
      }
    } catch (error) {
      lastError = error as Error;
    }

    // Check if we have time for another attempt
    const elapsed = performance.now() - startTime;
    if (elapsed + currentInterval >= timeout) {
      break;
    }

    // Wait before next attempt
    await sleep(currentInterval);

    // Apply backoff strategy if enabled
    if (backoff) {
      currentInterval = Math.min(currentInterval * 1.5, maxBackoffInterval);
    }
  }

  // Timeout reached
  if (onTimeout) {
    await onTimeout();
  }

  const duration = performance.now() - startTime;
  const baseMessage = errorMessage || `Condition not met within ${timeout}ms`;
  const details = `(${attempts} attempts over ${Math.round(duration)}ms)`;
  const errorInfo = lastError ? `\nLast error: ${lastError.message}` : '';
  
  throw new Error(`${baseMessage} ${details}${errorInfo}`);
}

/**
 * @notice Waits for a boolean condition to become true
 * @dev Specialized version of waitFor that only accepts boolean conditions
 * @param condition Function that returns a boolean value to wait for
 * @param errorMessage Optional custom error message for timeout failures
 * @param options Configuration options for timeout, interval, and backoff behavior
 * @return Promise that resolves when condition returns true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  errorMessage?: string,
  options?: WaitForOptions
): Promise<void> {
  await waitFor(
    async () => {
      const result = await condition();
      return result ? true : null;
    },
    { ...options, errorMessage }
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

