"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const graphql_1 = require("graphql");
const p_retry_1 = __importDefault(require("p-retry"));
const retry_config_1 = require("./retry-config");
const graphql_2 = require("../dist/gql/graphql");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
        this.retryOptions = retry_config_1.RETRY_OPTIONS;
    }
    async query(document, schema, variables, daoId) {
        const startTime = Date.now();
        console.log(`🔄 AnticaptureClient query starting (retries: ${this.retryOptions.retries})`);
        try {
            const result = await (0, p_retry_1.default)(async () => {
                const headers = this.buildHeaders(daoId);
                const response = await this.httpClient.post('', {
                    query: (0, graphql_1.print)(document),
                    variables,
                }, { headers });
                return schema.parse(response.data.data);
            }, {
                ...this.retryOptions,
                shouldRetry: retry_config_1.isRetryableError,
                onFailedAttempt: (error) => {
                    console.log(`❌ AnticaptureClient retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
                    if (this.retryOptions.onFailedAttempt) {
                        this.retryOptions.onFailedAttempt(error);
                    }
                }
            });
            const duration = Date.now() - startTime;
            console.log(`✅ AnticaptureClient query completed in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.log(`💥 AnticaptureClient query failed after ${duration}ms: ${error}`);
            throw error;
        }
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
                const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, dao.id);
                return (0, schemas_1.processVotingPowerHistory)(validated, dao.id);
            });
            const results = await Promise.all(queryPromises);
            return results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
        }
        const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, daoId);
        return (0, schemas_1.processVotingPowerHistory)(validated, daoId);
    }
}
exports.AnticaptureClient = AnticaptureClient;
