"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const graphql_1 = require("graphql");
const graphql_2 = require("../dist/gql/graphql");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async query(document, schema, variables, daoId) {
        const headers = this.buildHeaders(daoId);
        const response = await this.httpClient.post('', {
            query: (0, graphql_1.print)(document),
            variables,
        }, { headers });
        if (response.data.errors) {
            throw new Error(JSON.stringify(response.data.errors));
        }
        return schema.parse(response.data.data);
    }
    buildHeaders(daoId) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (daoId) {
            headers["anticapture-dao-id"] = daoId;
        }
        return headers;
    }
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO objects with blockTime added
     */
    async getDAOs() {
        try {
            const validated = await this.query(graphql_2.GetDaOsDocument, schemas_1.SafeDaosResponseSchema, undefined, undefined);
            return validated.daos.items.map((dao) => ({
                id: dao.id,
                // blockTime: dao.blockTime, // TODO: Uncomment when API supports this field
                blockTime: 12, // Temporary hardcoded value - Ethereum block time
                votingDelay: dao.votingDelay || '0'
            }));
        }
        catch (error) {
            console.warn('Returning empty DAO list due to API error: ', error instanceof Error ? error.message : error);
            return [];
        }
    }
    /**
     * Fetches a single proposal by ID with full type safety
     */
    async getProposalById(id) {
        try {
            const variables = {
                id: id
            };
            const validated = await this.query(graphql_2.GetProposalByIdDocument, schemas_1.SafeProposalByIdResponseSchema, variables, undefined);
            return validated.proposalsOnchain;
        }
        catch (error) {
            console.warn(`Returning null for proposal ${id} due to API error`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    async listProposals(variables, daoId) {
        if (!daoId && !variables?.where?.daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const dao of allDAOs) {
                const variablesWithDao = {
                    ...variables,
                    where: {
                        ...variables?.where,
                        daoId: dao.id
                    }
                };
                try {
                    const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variablesWithDao, dao.id);
                    allProposals.push(...(0, schemas_1.processProposals)(validated, dao.id));
                }
                catch (error) {
                    console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                }
            }
            return allProposals;
        }
        try {
            const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, daoId);
            return (0, schemas_1.processProposals)(validated, daoId);
        }
        catch (error) {
            console.warn(`Error querying proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
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
                try {
                    const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variablesWithDao, dao.id);
                    return (0, schemas_1.processVotingPowerHistory)(validated, dao.id);
                }
                catch (error) {
                    console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                    return [];
                }
            });
            const results = await Promise.all(queryPromises);
            return results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        }
        try {
            const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, daoId);
            return (0, schemas_1.processVotingPowerHistory)(validated, daoId);
        }
        catch (error) {
            console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
}
exports.AnticaptureClient = AnticaptureClient;
