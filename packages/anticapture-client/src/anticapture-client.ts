import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export abstract class AnticaptureClient {
  protected readonly httpClient: AxiosInstance;
  protected readonly endpoint: string;

  constructor(endpoint: string, httpClient: AxiosInstance) {
    this.endpoint = endpoint;
    this.httpClient = httpClient;
  }

  protected async query<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables
  ): Promise<TResult> {
    const response = await this.httpClient.post(this.endpoint, {
      query: print(document),
      variables,
    });

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  }
}