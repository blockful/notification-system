"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const graphql_1 = require("graphql");
const graphql_2 = require("./gql/graphql");
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
        return result.daos.items.map(dao => dao.id);
    }
    /**
     * Fetches a single proposal by ID with full type safety
     */
    async getProposalById(id) {
        const variables = {
            id: id
        };
        const response = await this.query(graphql_2.GetProposalByIdDocument, variables);
        return response.proposalsOnchain;
    }
    /**
     * Lists proposals with optional filtering and pagination with full type safety
     */
    async listProposals(variables, daoId) {
        if (!daoId && !variables?.where?.daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const currentDaoId of allDAOs) {
                const response = await this.query(graphql_2.ListProposalsDocument, variables, currentDaoId);
                const proposalsWithDaoId = response.proposalsOnchains.items.reduce((acc, proposal) => {
                    if (proposal !== null) {
                        acc.push({
                            ...proposal,
                            daoId: proposal.daoId || currentDaoId
                        });
                    }
                    return acc;
                }, []);
                allProposals.push(...proposalsWithDaoId);
            }
            return allProposals;
        }
        const response = await this.query(graphql_2.ListProposalsDocument, variables, daoId);
        return response.proposalsOnchains.items.reduce((acc, proposal) => {
            if (proposal !== null) {
                acc.push({
                    ...proposal,
                    daoId: proposal.daoId || daoId
                });
            }
            return acc;
        }, []);
    }
}
exports.AnticaptureClient = AnticaptureClient;
