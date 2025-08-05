"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const graphql_1 = require("graphql");
const graphql_2 = require("./gql/graphql");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async query(document, schema, variables, daoId) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        // Only add dao-id header if specified
        if (daoId) {
            headers["anticapture-dao-id"] = daoId;
        }
        const response = await this.httpClient.post('', {
            query: (0, graphql_1.print)(document),
            variables,
        }, { headers });
        // Handle empty or undefined responses
        if (!response || !response.data) {
            console.warn('No data received from GraphQL endpoint, returning empty response');
            return schema.parse({});
        }
        if (response.data.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
        }
        return schema.parse(response.data.data);
    }
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO objects with blockTime added
     */
    async getDAOs() {
        const validated = await this.query(graphql_2.GetDaOsDocument, schemas_1.SafeDaosResponseSchema, undefined, undefined);
        return validated.daos.items.map((dao) => ({
            id: dao.id,
            // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
            blockTime: 12, // Temporary hardcoded value - Ethereum block time
            votingDelay: dao.votingDelay || '0'
        }));
    }
    /**
     * Fetches a single proposal by ID with full type safety
     */
    async getProposalById(id) {
        const variables = {
            id: id
        };
        const validated = await this.query(graphql_2.GetProposalByIdDocument, schemas_1.SafeProposalByIdResponseSchema, variables, undefined);
        return validated.proposalsOnchain;
    }
    async listProposals(variables, daoId) {
        if (!daoId && !variables?.where?.daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const dao of allDAOs) {
                const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, dao.id);
                allProposals.push(...(0, schemas_1.processProposals)(validated, dao.id));
            }
            return allProposals;
        }
        const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, daoId);
        return (0, schemas_1.processProposals)(validated, daoId);
    }
    /**
     * Lists voting power history with full type safety
     * @param variables - Query variables for filtering and pagination
     * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
     * @returns Array of voting power history items
     */
    async listVotingPowerHistory(variables, daoId) {
        if (!daoId && !variables?.where?.daoId) {
            const allDAOs = await this.getDAOs();
            const queryPromises = allDAOs.map(async (dao) => {
                const variablesWithDao = {
                    ...variables,
                    where: {
                        ...variables?.where,
                        daoId: dao.id
                    }
                };
                const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variablesWithDao, dao.id);
                return (0, schemas_1.processVotingPowerHistory)(validated, dao.id);
            });
            const results = await Promise.all(queryPromises);
            return results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        }
        const variablesWithDao = {
            ...variables,
            where: {
                ...variables?.where,
                daoId: daoId
            }
        };
        const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variablesWithDao, daoId);
        return (0, schemas_1.processVotingPowerHistory)(validated, daoId);
    }
}
exports.AnticaptureClient = AnticaptureClient;
