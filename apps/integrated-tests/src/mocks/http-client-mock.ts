import { createMockFunction } from './jest-mock-factory';

/**
 * @notice Setup class for HTTP client mocking in integration tests
 * @dev Provides a mock HTTP client with standard REST methods
 */
export class HttpClientMockSetup {
  private mockHttpClient: any;

  /**
   * @notice Creates a new HTTP client mock setup instance
   * @dev Initializes mock HTTP client with common REST methods
   */
  constructor() {
    this.mockHttpClient = {
      post: createMockFunction(),
      get: createMockFunction(),
      put: createMockFunction(),
      delete: createMockFunction(),
      defaults: {
        baseURL: 'http://mocked-endpoint.com/graphql'
      },
      interceptors: {
        request: { use: () => 0, eject: () => {} },
        response: { use: () => 0, eject: () => {} }
      }
    } as any;
  }

  /**
   * @notice Gets the mock HTTP client instance
   * @return The mocked HTTP client with stubbed methods
   */
  getMockClient(): any {
    return this.mockHttpClient;
  }

  /**
   * @notice Resets the mock HTTP client to clean state
   * @dev Clears all mock call history and implementations
   */
  reset(): void {
    this.mockHttpClient.post.mockReset();
  }

  /**
   * @notice Clears the mock HTTP client call history
   * @dev Keeps implementations but removes call records
   */
  clear(): void {
    this.mockHttpClient.post.mockClear();
  }
}