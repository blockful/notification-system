"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const axios_retry_1 = __importStar(require("axios-retry"));
const graphql_1 = require("graphql");
const viem_1 = require("viem");
const graphql_2 = require("./gql/graphql");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(httpClient, maxRetries = 4, timeout = 15000) {
        this.httpClient = httpClient;
        this.httpClient.defaults.timeout = timeout;
        (0, axios_retry_1.default)(this.httpClient, {
            retries: maxRetries,
            retryDelay: axios_retry_1.exponentialDelay, // 1s, 2s, 4s, 8s
            retryCondition: (error) => {
                return (0, axios_retry_1.isNetworkOrIdempotentRequestError)(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500);
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.warn(`[AnticaptureClient] Retry ${retryCount}/${maxRetries} for ${requestConfig.url || 'request'}: ${error.message}`);
            },
        });
    }
    /**
     * Recursively normalizes Ethereum addresses in an object/array structure
     * @param obj - Any value to process
     * @param transformer - Function to transform each detected address
     * @returns The processed value with transformed addresses
     */
    normalizeAddressesInObject(obj, transformer) {
        if (obj == null)
            return obj;
        if (typeof obj === 'string') {
            try {
                return (0, viem_1.isAddress)(obj) ? transformer(obj) : obj;
            }
            catch {
                return obj;
            }
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.normalizeAddressesInObject(item, transformer));
        }
        if (typeof obj === 'object') {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.normalizeAddressesInObject(v, transformer)]));
        }
        return obj;
    }
    /**
     * Converts addresses to EIP-55 checksum format (for API input - case-sensitive API)
     */
    toChecksum(obj) {
        return this.normalizeAddressesInObject(obj, (address) => (0, viem_1.getAddress)(address));
    }
    /**
     * Converts addresses to lowercase (for our system - case-insensitive DB)
     */
    toLowercase(obj) {
        return this.normalizeAddressesInObject(obj, (address) => address.toLowerCase());
    }
    async query(document, schema, variables, daoId) {
        const headers = this.buildHeaders(daoId);
        // INPUT: Convert addresses to checksum format for case-sensitive API
        const checksummedVariables = variables ? this.toChecksum(variables) : variables;
        const response = await this.httpClient.post('', {
            query: (0, graphql_1.print)(document),
            variables: checksummedVariables,
        }, { headers });
        if (response.data.errors) {
            throw new Error(JSON.stringify(response.data.errors));
        }
        return schema.parse(this.toLowercase(response.data.data));
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
            // Sort globally by timestamp desc (most recent first)
            if (variables?.fromEndDate) {
                allProposals.sort((a, b) => parseInt(b?.endTimestamp || '0') - parseInt(a?.endTimestamp || '0'));
            }
            else {
                allProposals.sort((a, b) => parseInt(b?.timestamp || '0') - parseInt(a?.timestamp || '0') || 0);
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
     * Fetches votes for a specific DAO using the votes API
     * @param daoId The DAO ID (passed via anticapture-dao-id header)
     * @param variables Query variables for filtering and pagination
     * @returns List of votes matching the criteria
     */
    async listVotes(daoId, variables) {
        try {
            // Convert simplified interface to GraphQL types
            const graphqlVariables = {
                voterAddressIn: variables?.voterAddressIn,
                fromDate: variables?.fromDate,
                toDate: variables?.toDate,
                limit: variables?.limit,
                skip: variables?.skip,
                orderBy: variables?.orderBy === 'timestamp' ? graphql_2.QueryInput_Votes_OrderBy.Timestamp :
                    variables?.orderBy === 'votingPower' ? graphql_2.QueryInput_Votes_OrderBy.VotingPower : undefined,
                orderDirection: variables?.orderDirection === 'asc' ? graphql_2.QueryInput_Votes_OrderDirection.Asc :
                    variables?.orderDirection === 'desc' ? graphql_2.QueryInput_Votes_OrderDirection.Desc : undefined,
                support: variables?.support,
            };
            const validated = await this.query(graphql_2.ListVotesDocument, schemas_1.SafeVotesResponseSchema, graphqlVariables, daoId);
            // Filter out null items from the response
            return validated.votes.items.filter((item) => item !== null);
        }
        catch (error) {
            console.warn(`Error fetching votes for DAO ${daoId}:`, error);
            return [];
        }
    }
    /**
     * Fetches addresses that haven't voted on a specific proposal
     * Note: API already filters for addresses with votingPower > 0
     * @param proposalId The proposal ID to check
     * @param daoId The DAO ID for the header
     * @param addresses Optional array of addresses to filter by
     * @returns List of non-voters with their voting power details
     */
    async getProposalNonVoters(proposalId, daoId, addresses) {
        try {
            const variables = {
                id: proposalId,
                ...(addresses && { addresses: addresses }),
            };
            const validated = await this.query(graphql_2.ProposalNonVotersDocument, schemas_1.SafeProposalNonVotersResponseSchema, variables, daoId);
            return validated.proposalNonVoters.items;
        }
        catch (error) {
            console.warn(`Error fetching non-voters for proposal ${proposalId}:`, error);
            return [];
        }
    }
    /**
     * List recent votes from all DAOs since a given timestamp
     * @param timestampGt Fetch votes with timestamp greater than this value (unix timestamp as string)
     * @param limit Maximum number of votes to fetch per DAO (default: 100)
     * @returns Array of votes from all DAOs with daoId included
     */
    async listRecentVotesFromAllDaos(timestampGt, limit = 100) {
        // First, fetch all DAOs
        const daos = await this.getDAOs();
        // Fetch votes from each DAO in parallel using the new API
        const votePromises = daos.map(async (dao) => {
            try {
                const votes = await this.listVotes(dao.id, {
                    fromDate: parseInt(timestampGt),
                    limit,
                    orderBy: 'timestamp',
                    orderDirection: 'asc'
                });
                // Add daoId to each vote since the new API doesn't return it
                return votes.map(vote => ({
                    ...vote,
                    daoId: dao.id
                }));
            }
            catch (error) {
                console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error);
                return []; // Return empty array for failed DAOs
            }
        });
        const voteArrays = await Promise.all(votePromises);
        // Flatten and sort by timestamp
        const allVotes = voteArrays.flat();
        allVotes.sort((a, b) => {
            return a.timestamp - b.timestamp;
        });
        return allVotes;
    }
}
exports.AnticaptureClient = AnticaptureClient;
