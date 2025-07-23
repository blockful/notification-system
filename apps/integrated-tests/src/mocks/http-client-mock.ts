import { jest } from '@jest/globals';

export class HttpClientMockSetup {
  private mockHttpClient: any;

  constructor() {
    this.mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        baseURL: 'http://mocked-endpoint.com/graphql'
      }
    } as any;
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