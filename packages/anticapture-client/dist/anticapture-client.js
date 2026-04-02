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
            'Accept': 'application/json',
            'x-client-source': 'notification-system'
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
                chainId: dao.chainId,
                alreadySupportCalldataReview: dao.alreadySupportCalldataReview ?? false,
                supportOffchainData: dao.supportOffchainData ?? false
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
                allProposals.sort((a, b) => (b?.endTimestamp ?? 0) - (a?.endTimestamp ?? 0));
            }
            else {
                allProposals.sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
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
     * Uses the new historicalVotingPower query which properly returns delegation and transfer data
     * @param variables - Query variables for filtering and pagination (fromDate, limit, skip, orderBy, orderDirection, accountId)
     * @param daoId - Optional specific DAO ID to query. If not provided, queries all DAOs
     * @returns Array of voting power history items
     */
    async listVotingPowerHistory(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const queryPromises = allDAOs.map(async (dao) => {
                try {
                    const validated = await this.query(graphql_2.ListHistoricalVotingPowerDocument, schemas_1.SafeHistoricalVotingPowerResponseSchema, variables, dao.id);
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
            const validated = await this.query(graphql_2.ListHistoricalVotingPowerDocument, schemas_1.SafeHistoricalVotingPowerResponseSchema, variables, daoId);
            return (0, schemas_1.processVotingPowerHistory)(validated, daoId);
        }
        catch (error) {
            console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    /**
     * Fetches votes for specific proposals and voter addresses
     * @param variables Query variables including daoId
     * @returns List of votes matching the criteria
     */
    async listVotes(daoId, variables) {
        try {
            const validated = await this.query(graphql_2.ListVotesDocument, schemas_1.SafeVotesResponseSchema, variables, daoId);
            return validated.votes.items.filter(item => item !== null);
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
     * Fetches addresses that haven't voted on a specific offchain (Snapshot) proposal
     * @param proposalId The Snapshot proposal ID to check
     * @param addresses Optional array of addresses to filter by
     * @returns List of non-voters
     */
    async getOffchainProposalNonVoters(proposalId, addresses) {
        try {
            const variables = {
                id: proposalId,
                ...(addresses && { addresses: addresses.join(',') }),
                orderDirection: 'desc',
            };
            const validated = await this.query(graphql_2.OffchainProposalNonVotersDocument, schemas_1.SafeOffchainProposalNonVotersResponseSchema, variables);
            return validated.offchainProposalNonVoters.items;
        }
        catch (error) {
            console.warn(`Error fetching offchain non-voters for proposal ${proposalId}:`, error);
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
        // Fetch votes from each DAO in parallel
        const votePromises = daos.map(async (dao) => {
            try {
                const votes = await this.listVotes(dao.id, {
                    fromDate: parseInt(timestampGt),
                    limit,
                    orderBy: graphql_2.QueryInput_Votes_OrderBy.Timestamp,
                    orderDirection: graphql_2.OrderDirection.Asc
                });
                // Add daoId to each vote
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
    /**
     * Fetches the event relevance threshold for a given DAO, event type, and relevance level.
     * Used to filter out low-impact events (e.g., small delegation changes).
     * @returns Threshold as a numeric string, or null if unavailable (fail-open)
     */
    async getEventThreshold(daoId, type, relevance) {
        try {
            const validated = await this.query(graphql_2.GetEventRelevanceThresholdDocument, schemas_1.EventThresholdResponseSchema, { type, relevance }, daoId);
            return validated.getEventRelevanceThreshold.threshold;
        }
        catch (error) {
            console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    ;
    /*
     * Lists offchain (Snapshot) proposals from all DAOs or a specific DAO
     * @param variables Query variables (skip, limit, orderDirection, status, fromDate)
     * @param daoId Optional specific DAO ID. If not provided, queries all DAOs
     * @returns Array of offchain proposal items with daoId attached
     */
    async listOffchainProposals(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const allProposals = [];
            for (const dao of allDAOs) {
                if (!dao.supportOffchainData) {
                    continue;
                }
                try {
                    const validated = await this.query(graphql_2.ListOffchainProposalsDocument, schemas_1.SafeOffchainProposalsResponseSchema, variables, dao.id);
                    const items = validated.offchainProposals.items.map(item => ({ ...item, daoId: dao.id }));
                    if (items.length > 0) {
                        allProposals.push(...items);
                    }
                }
                catch (error) {
                    console.warn(`Skipping offchain proposals for ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                }
            }
            // Sort by created timestamp desc (most recent first)
            allProposals.sort((a, b) => b.created - a.created);
            return allProposals;
        }
        try {
            const validated = await this.query(graphql_2.ListOffchainProposalsDocument, schemas_1.SafeOffchainProposalsResponseSchema, variables, daoId);
            return validated.offchainProposals.items.map(item => ({ ...item, daoId }));
        }
        catch (error) {
            console.warn(`Error querying offchain proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    /**
     * Fetches offchain (Snapshot) votes for a specific DAO
     * @param daoId The DAO ID to query
     * @param variables Query variables for filtering and pagination
     * @returns Array of offchain vote items
     */
    async listOffchainVotes(daoId, variables) {
        try {
            const validated = await this.query(graphql_2.ListOffchainVotesDocument, schemas_1.SafeOffchainVotesResponseSchema, variables, daoId);
            return validated.votesOffchain.items;
        }
        catch (error) {
            console.warn(`Error fetching offchain votes for DAO ${daoId}:`, error);
            return [];
        }
    }
    /**
     * Fetches recent offchain votes from all DAOs since a given timestamp
     * @param fromDate Fetch votes with created timestamp greater than this value (unix timestamp)
     * @param limit Maximum number of votes to fetch per DAO (default: 100)
     * @returns Array of offchain votes from all DAOs with daoId included
     */
    async listRecentOffchainVotesFromAllDaos(fromDate, limit = 100) {
        const daos = await this.getDAOs();
        const votePromises = daos
            .filter(dao => dao.supportOffchainData)
            .map(async (dao) => {
            try {
                const votes = await this.listOffchainVotes(dao.id, {
                    fromDate,
                    limit,
                    orderBy: graphql_2.QueryInput_VotesOffchain_OrderBy.Timestamp,
                    orderDirection: graphql_2.OrderDirection.Asc
                });
                return votes.map(vote => ({
                    ...vote,
                    daoId: dao.id
                }));
            }
            catch (error) {
                console.warn(`Failed to fetch offchain votes for DAO ${dao.id}:`, error);
                return [];
            }
        });
        const voteArrays = await Promise.all(votePromises);
        const allVotes = voteArrays.flat();
        allVotes.sort((a, b) => a.created - b.created);
        return allVotes;
    }
}
exports.AnticaptureClient = AnticaptureClient;
