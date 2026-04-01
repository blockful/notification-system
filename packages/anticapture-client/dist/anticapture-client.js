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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRelevance = exports.FeedEventType = exports.AnticaptureClient = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importStar(require("axios-retry"));
const viem_1 = require("viem");
const dao_id_1 = require("./dao-id");
const types_1 = require("./types");
const schemas_1 = require("./schemas");
Object.defineProperty(exports, "FeedEventType", { enumerable: true, get: function () { return schemas_1.FeedEventType; } });
Object.defineProperty(exports, "FeedRelevance", { enumerable: true, get: function () { return schemas_1.FeedRelevance; } });
class AnticaptureClient {
    constructor(httpClient, maxRetries = 4, timeout = 15000) {
        this.httpClient = httpClient;
        this.httpClient.defaults.timeout = timeout;
        this.httpClient.defaults.baseURL = this.normalizeBaseUrl(this.httpClient.defaults.baseURL);
        (0, axios_retry_1.default)(this.httpClient, {
            retries: maxRetries,
            retryDelay: axios_retry_1.exponentialDelay,
            retryCondition: (error) => {
                return (0, axios_retry_1.isNetworkOrIdempotentRequestError)(error) ||
                    (error.response?.status !== undefined && error.response.status >= 500);
            },
            onRetry: (retryCount, error, requestConfig) => {
                console.warn(`[AnticaptureClient] Retry ${retryCount}/${maxRetries} for ${requestConfig.url || 'request'}: ${error.message}`);
            },
        });
    }
    normalizeBaseUrl(baseURL) {
        if (!baseURL)
            return baseURL;
        return baseURL.replace(/\/graphql\/?$/, '');
    }
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
            return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, this.normalizeAddressesInObject(value, transformer)]));
        }
        return obj;
    }
    toChecksum(obj) {
        return this.normalizeAddressesInObject(obj, (address) => (0, viem_1.getAddress)(address));
    }
    toLowercase(obj) {
        return this.normalizeAddressesInObject(obj, (address) => address.toLowerCase());
    }
    serializeParams(params) {
        if (!params)
            return undefined;
        return Object.fromEntries(Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value]));
    }
    async request(path, schema, params) {
        const response = await this.httpClient.get(path, {
            headers: {
                Accept: 'application/json',
                'x-client-source': 'notification-system',
            },
            params: this.serializeParams(this.toChecksum(params)),
        });
        return schema.parse(this.toLowercase(response.data));
    }
    buildDaoPath(daoId) {
        return `/${encodeURIComponent((0, dao_id_1.toApiDaoId)(daoId))}`;
    }
    async getDAOs() {
        try {
            const validated = await this.request('/daos', schemas_1.SafeDaosResponseSchema);
            return validated.items.map((dao) => {
                const normalized = (0, schemas_1.normalizeDao)(dao);
                return {
                    id: normalized.id,
                    blockTime: 12,
                    votingDelay: normalized.votingDelay,
                    chainId: normalized.chainId,
                    alreadySupportCalldataReview: normalized.alreadySupportCalldataReview,
                    supportOffchainData: normalized.supportOffchainData,
                };
            });
        }
        catch (error) {
            console.warn('Returning empty DAO list due to API error:', error instanceof Error ? error.message : error);
            return [];
        }
    }
    async getProposalById(id) {
        const daos = await this.getDAOs();
        for (const dao of daos) {
            try {
                const proposal = await this.request(`${this.buildDaoPath(dao.id)}/proposals/${encodeURIComponent(id)}`, schemas_1.SafeProposalByIdResponseSchema);
                return (0, schemas_1.normalizeProposal)(proposal);
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                    continue;
                }
                console.warn(`Skipping proposal lookup for DAO ${dao.id} due to API error:`, error instanceof Error ? error.message : error);
            }
        }
        return null;
    }
    async listProposals(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const results = await Promise.all(allDAOs.map(async (dao) => {
                try {
                    const validated = await this.request(`${this.buildDaoPath(dao.id)}/proposals`, schemas_1.SafeProposalsResponseSchema, variables);
                    return validated.items.map(schemas_1.normalizeProposal);
                }
                catch (error) {
                    console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                    return [];
                }
            }));
            const allProposals = results.flat();
            if (variables?.fromEndDate) {
                allProposals.sort((a, b) => b.endTimestamp - a.endTimestamp);
            }
            else {
                allProposals.sort((a, b) => b.timestamp - a.timestamp);
            }
            return allProposals;
        }
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/proposals`, schemas_1.SafeProposalsResponseSchema, variables);
            return validated.items.map(schemas_1.normalizeProposal);
        }
        catch (error) {
            console.warn(`Error querying proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    async listVotingPowerHistory(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const results = await Promise.all(allDAOs.map(async (dao) => {
                try {
                    const validated = await this.request(`${this.buildDaoPath(dao.id)}/voting-powers/historical`, schemas_1.SafeHistoricalVotingPowerResponseSchema, variables);
                    return (0, schemas_1.processVotingPowerHistory)(validated.items, dao.id, dao.chainId);
                }
                catch (error) {
                    console.warn(`Skipping ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                    return [];
                }
            }));
            return results.flat().sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        }
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/voting-powers/historical`, schemas_1.SafeHistoricalVotingPowerResponseSchema, variables);
            return (0, schemas_1.processVotingPowerHistory)(validated.items, daoId);
        }
        catch (error) {
            console.warn(`Error querying voting power history for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    async listVotes(daoId, variables) {
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/votes`, schemas_1.SafeVotesResponseSchema, variables);
            return validated.items.map(schemas_1.normalizeVote);
        }
        catch (error) {
            console.warn(`Error fetching votes for DAO ${daoId}:`, error instanceof Error ? error.message : error);
            return [];
        }
    }
    async getProposalNonVoters(proposalId, daoId, addresses) {
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/proposals/${encodeURIComponent(proposalId)}/non-voters`, schemas_1.SafeProposalNonVotersResponseSchema, addresses ? { addresses } : undefined);
            return validated.items.map(schemas_1.normalizeNonVoter);
        }
        catch (error) {
            console.warn(`Error fetching non-voters for proposal ${proposalId}:`, error instanceof Error ? error.message : error);
            return [];
        }
    }
    async listRecentVotesFromAllDaos(timestampGt, limit = 100) {
        const daos = await this.getDAOs();
        const voteArrays = await Promise.all(daos.map(async (dao) => {
            try {
                const votes = await this.listVotes(dao.id, {
                    fromDate: Number(timestampGt),
                    limit,
                    orderBy: types_1.QueryInput_Votes_OrderBy.Timestamp,
                    orderDirection: types_1.OrderDirection.Asc,
                });
                return votes.map(vote => ({
                    ...vote,
                    daoId: dao.id,
                }));
            }
            catch (error) {
                console.warn(`Failed to fetch votes for DAO ${dao.id}:`, error instanceof Error ? error.message : error);
                return [];
            }
        }));
        return voteArrays.flat().sort((a, b) => a.timestamp - b.timestamp);
    }
    async getEventThreshold(daoId, type, relevance) {
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/event-relevance/threshold`, schemas_1.EventThresholdResponseSchema, { type, relevance });
            return validated.threshold ?? null;
        }
        catch (error) {
            console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, error instanceof Error ? error.message : error);
            return null;
        }
    }
    async listOffchainProposals(variables, daoId) {
        if (!daoId) {
            const allDAOs = await this.getDAOs();
            const results = await Promise.all(allDAOs.map(async (dao) => {
                if (!dao.supportOffchainData) {
                    return [];
                }
                try {
                    const validated = await this.request(`${this.buildDaoPath(dao.id)}/offchain/proposals`, schemas_1.SafeOffchainProposalsResponseSchema, variables);
                    return validated.items.map(item => ({ ...(0, schemas_1.normalizeOffchainProposal)(item), daoId: dao.id }));
                }
                catch (error) {
                    console.warn(`Skipping offchain proposals for ${dao.id} due to API error: ${error instanceof Error ? error.message : error}`);
                    return [];
                }
            }));
            return results.flat().sort((a, b) => b.created - a.created);
        }
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/offchain/proposals`, schemas_1.SafeOffchainProposalsResponseSchema, variables);
            return validated.items.map(item => ({ ...(0, schemas_1.normalizeOffchainProposal)(item), daoId: (0, dao_id_1.toLegacyDaoId)(daoId) }));
        }
        catch (error) {
            console.warn(`Error querying offchain proposals for DAO ${daoId}: ${error instanceof Error ? error.message : error}`);
            return [];
        }
    }
    async listOffchainVotes(daoId, variables) {
        try {
            const validated = await this.request(`${this.buildDaoPath(daoId)}/offchain/votes`, schemas_1.SafeOffchainVotesResponseSchema, variables);
            return validated.items.map(schemas_1.normalizeOffchainVote);
        }
        catch (error) {
            console.warn(`Error fetching offchain votes for DAO ${daoId}:`, error instanceof Error ? error.message : error);
            return [];
        }
    }
    async listRecentOffchainVotesFromAllDaos(fromDate, limit = 100) {
        const daos = await this.getDAOs();
        const voteArrays = await Promise.all(daos.map(async (dao) => {
            try {
                const votes = await this.listOffchainVotes(dao.id, {
                    fromDate,
                    limit,
                    orderBy: types_1.QueryInput_VotesOffchain_OrderBy.Timestamp,
                    orderDirection: types_1.OrderDirection.Asc,
                });
                return votes.map(vote => ({
                    ...vote,
                    daoId: dao.id,
                }));
            }
            catch (error) {
                console.warn(`Failed to fetch offchain votes for DAO ${dao.id}:`, error instanceof Error ? error.message : error);
                return [];
            }
        }));
        return voteArrays.flat().sort((a, b) => a.created - b.created);
    }
}
exports.AnticaptureClient = AnticaptureClient;
