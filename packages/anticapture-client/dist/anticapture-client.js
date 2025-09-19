"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const graphql_1 = require("graphql");
const viem_1 = require("viem");
const graphql_2 = require("./gql/graphql");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Recursively normalizes Ethereum addresses to EIP-55 checksum format
     * Detects addresses by their format using viem's isAddress validation
     * @param obj - Any value to normalize (primitives, objects, arrays, nested structures)
     * @returns The normalized value with checksummed addresses
     */
    normalizeAddresses(obj) {
        if (obj == null)
            return obj;
        if (typeof obj === 'string') {
            try {
                return (0, viem_1.isAddress)(obj) ? (0, viem_1.getAddress)(obj) : obj;
            }
            catch {
                return obj;
            }
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.normalizeAddresses(item));
        }
        if (typeof obj === 'object') {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.normalizeAddresses(v)]));
        }
        return obj;
    }
    async query(document, schema, variables, daoId) {
        const headers = this.buildHeaders(daoId);
        // Normalize addresses in variables to EIP-55 checksum format
        const normalizedVariables = variables ? this.normalizeAddresses(variables) : variables;
        const response = await this.httpClient.post('', {
            query: (0, graphql_1.print)(document),
            variables: normalizedVariables,
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
                votingDelay: dao.votingDelay || '0',
                chainId: dao.chainId
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
            return validated.proposal;
        }
        catch (error) {
            console.warn(`Returning null for proposal ${id} due to API error`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    async listProposals(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const dao of allDAOs) {
                try {
                    const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, dao.id);
                    const processed = (0, schemas_1.processProposals)(validated, dao.id);
                    if (processed && processed.length > 0) {
                        allProposals.push(...processed);
                    }
                }
                catch (error) {
                    console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                }
            }
            return allProposals;
        }
        try {
            const validated = await this.query(graphql_2.ListProposalsDocument, schemas_1.SafeProposalsResponseSchema, variables, daoId);
            return (0, schemas_1.processProposals)(validated, daoId) || [];
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
                try {
                    const validated = await this.query(graphql_2.ListVotingPowerHistorysDocument, schemas_1.SafeVotingPowerHistoryResponseSchema, variables, dao.id);
                    return (0, schemas_1.processVotingPowerHistory)(validated, dao.id, dao.chainId);
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
    /**
     * Fetches votes for specific proposals and voter addresses
     * @param variables Query variables including daoId, proposalId_in, voterAccountId_in
     * @returns List of votes matching the criteria
     */
    async listVotesOnchains(variables) {
        try {
            const validated = await this.query(graphql_2.ListVotesOnchainsDocument, schemas_1.SafeVotesOnchainsResponseSchema, variables, variables.daoId);
            return validated.votesOnchains.items;
        }
        catch (error) {
            console.warn('Error fetching votes', error);
            return [];
        }
    }
    /**
     * List recent votes from all DAOs since a given timestamp
     * @param timestampGt Fetch votes with timestamp greater than this value
     * @param limit Maximum number of votes to fetch per DAO (default: 100)
     * @returns Array of votes from all DAOs
     */
    async listRecentVotesFromAllDaos(timestampGt, limit = 100) {
        // First, fetch all DAOs
        const daos = await this.getDAOs();
        // Fetch votes from each DAO in parallel
        const votePromises = daos.map(dao => this.listVotesOnchains({
            daoId: dao.id,
            timestamp_gt: timestampGt,
            limit,
            orderBy: 'timestamp',
            orderDirection: 'asc'
        }).catch(error => {
            console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error);
            return []; // Return empty array for failed DAOs
        }));
        const voteArrays = await Promise.all(votePromises);
        // Flatten and sort by timestamp
        const allVotes = voteArrays.flat();
        allVotes.sort((a, b) => {
            const timestampA = parseInt(a.timestamp || '0');
            const timestampB = parseInt(b.timestamp || '0');
            return timestampA - timestampB;
        });
        return allVotes;
    }
}
exports.AnticaptureClient = AnticaptureClient;
