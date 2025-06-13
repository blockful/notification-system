import { jest } from '@jest/globals';

/**
 * Creates a minimal mock HTTP client for testing
 * Used to mock axios instances in integration tests
 */
export const createMockHttpClient = () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: {
    baseURL: 'http://mocked-endpoint.com/graphql'
  }
} as any);

export class HttpClientMockSetup {
  private mockHttpClient: any;

  constructor() {
    this.mockHttpClient = createMockHttpClient();
  }

  getMockClient(): any {
    return this.mockHttpClient;
  }

  reset(): void {
    this.mockHttpClient.post.mockReset();
  }

  clear(): void {
    this.mockHttpClient.post.mockClear();
  }
}