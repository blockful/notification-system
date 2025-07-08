import { AxiosInstance } from 'axios';
import { print } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { z } from 'zod';
import type {
  GetProposalByIdQuery,
  GetProposalByIdQueryVariables,
  ListProposalsQuery,
  ListProposalsQueryVariables
} from './gql/graphql';
import { GetDaOsDocument, GetProposalByIdDocument, ListProposalsDocument } from './gql/graphql';
import { SafeDaosResponseSchema, SafeProposalByIdResponseSchema, SafeProposalsResponseSchema, processProposals } from './schemas';
type ProposalItems = ListProposalsQuery['proposalsOnchains']['items'];

export class AnticaptureClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  private async query<TResult, TVariables, TSchema extends z.ZodSchema<any>>(
    document: TypedDocumentNode<TResult, TVariables>,
    schema: TSchema,
    variables?: TVariables,
    daoId?: string
  ): Promise<z.infer<TSchema>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Only add dao-id header if specified
    if (daoId) {
      headers["anticapture-dao-id"] = daoId;
    }

    const response = await this.httpClient.post('', {
      query: print(document),
      variables,
    }, { headers });

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return schema.parse(response.data.data);
  }
  

  /**
   * Fetches all DAOs from the anticapture GraphQL API with full type safety
   * @returns Array of DAO IDs
   */
  async getDAOs(): Promise<string[]> {
    const validated = await this.query(GetDaOsDocument, SafeDaosResponseSchema, undefined, undefined);
    return validated.daos.items.map((dao: { id: string }) => dao.id);
  }

  /**
   * Fetches a single proposal by ID with full type safety
   */
  async getProposalById(id: string): Promise<GetProposalByIdQuery['proposalsOnchain'] | null> {
    const variables: GetProposalByIdQueryVariables = {
      id: id
    };

    const validated = await this.query(GetProposalByIdDocument, SafeProposalByIdResponseSchema, variables, undefined);
    return validated.proposalsOnchain;
  }


  async listProposals(variables?: ListProposalsQueryVariables, daoId?: string): Promise<ProposalItems> {
    if (!daoId && !variables?.where?.daoId) {
      const allDAOs = await this.getDAOs();
      const allProposals: ProposalItems = [];

      for (const currentDaoId of allDAOs) {
        const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, currentDaoId);
        allProposals.push(...processProposals(validated, currentDaoId));
      }

      return allProposals;
    }

    const validated = await this.query(ListProposalsDocument, SafeProposalsResponseSchema, variables, daoId);
    return processProposals(validated, daoId!);
  }
}