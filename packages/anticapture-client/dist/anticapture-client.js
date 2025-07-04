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
    async query(document, variables, daoId) {
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
        return response.data.data;
    }
    /**
     * Fetches all DAOs from the anticapture GraphQL API with full type safety
     * @returns Array of DAO IDs
     */
    async getDAOs() {
        const result = await this.query(graphql_2.GetDaOsDocument);
        const validated = (0, schemas_1.validateDaosResponse)(result);
        return validated.daos.items.map(dao => dao.id);
    }
    /**
     * Fetches a single proposal by ID with full type safety
     */
    async getProposalById(id) {
        const variables = {
            id: id
        };
        const response = await this.query(graphql_2.GetProposalByIdDocument, variables);
        const validated = (0, schemas_1.validateProposalByIdResponse)(response);
        return validated.proposalsOnchain;
    }
    async listProposals(variables, daoId) {
        if (!daoId && !variables?.where?.daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const currentDaoId of allDAOs) {
                const response = await this.query(graphql_2.ListProposalsDocument, variables, currentDaoId);
                const processedProposals = (0, schemas_1.validateAndProcessProposals)(response, currentDaoId);
                allProposals.push(...processedProposals);
            }
            return allProposals;
        }
        const response = await this.query(graphql_2.ListProposalsDocument, variables, daoId);
        return (0, schemas_1.validateAndProcessProposals)(response, daoId);
    }
}
exports.AnticaptureClient = AnticaptureClient;
