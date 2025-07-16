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
        if (response.data.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
        }
        return schema.parse(response.data.data);
    }
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO IDs
     */
    async getDAOs() {
        const validated = await this.query(graphql_2.GetDaOsDocument, schemas_1.SafeDaosResponseSchema, undefined, undefined);
        return validated.daos.items.map((dao) => dao.id);
    }
    /**
     * Fetches all DAOs with enriched data including blockTime
     * @returns Array of enriched DAO objects
     */
    async getEnrichedDAOs() {
        const validated = await this.query(graphql_2.GetDaOsDocument, schemas_1.SafeDaosResponseSchema, undefined, undefined);
        return validated.daos.items.map((dao) => ({
            ...dao,
            blockTime: 12 // Hardcoded for now, will be from API in future
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
            for (const currentDaoId of allDAOs) {
                const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, currentDaoId);
                allProposals.push(...(0, schemas_1.processProposals)(validated, currentDaoId));
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
            const queryPromises = allDAOs.map(async (currentDaoId) => {
                const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, currentDaoId);
                return (0, schemas_1.processVotingPowerHistory)(validated, currentDaoId);
            });
            const results = await Promise.all(queryPromises);
            return results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        }
        const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, daoId);
        return (0, schemas_1.processVotingPowerHistory)(validated, daoId);
    }
}
exports.AnticaptureClient = AnticaptureClient;
