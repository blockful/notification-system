import { createMockFunction } from './jest-mock-factory';

export class HttpClientMockSetup {
  private mockHttpClient: any;

  constructor() {
    this.mockHttpClient = {
      post: createMockFunction(),
      get: createMockFunction(),
      put: createMockFunction(),
      delete: createMockFunction(),
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