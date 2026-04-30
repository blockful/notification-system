"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnticaptureClient = void 0;
const client_1 = require("@anticapture/client");
const viem_1 = require("viem");
const with_retry_and_timeout_1 = require("./with-retry-and-timeout");
const schemas_1 = require("./schemas");
class AnticaptureClient {
    constructor(config) {
        this.retries = config.maxRetries ?? 4;
        this.timeoutMs = config.timeoutMs ?? 15000;
        this.sdkConfig = {
            baseURL: config.baseURL,
            headers: {
                'x-client-source': 'notification-system',
                ...config.defaultHeaders,
            },
        };
    }
    async call(fn) {
        return (0, with_retry_and_timeout_1.withRetryAndTimeout)(fn, { retries: this.retries, timeoutMs: this.timeoutMs });
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
        if (Array.isArray(obj))
            return obj.map(i => this.normalizeAddressesInObject(i, transformer));
        if (typeof obj === 'object') {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.normalizeAddressesInObject(v, transformer)]));
        }
        return obj;
    }
    toChecksum(o) { return this.normalizeAddressesInObject(o, viem_1.getAddress); }
    toLowercase(o) { return this.normalizeAddressesInObject(o, a => a.toLowerCase()); }
    async getDAOs() {
        try {
            const res = await this.call(() => (0, client_1.getDaos)(this.sdkConfig));
            const items = res.items ?? [];
            return items.map(d => ({
                id: d.id,
                blockTime: 12,
                votingDelay: d.votingDelay ?? '0',
                chainId: d.chainId ?? 1,
                alreadySupportCalldataReview: d.alreadySupportCalldataReview ?? false,
                supportOffchainData: d.supportOffchainData ?? false,
            }));
        }
        catch (err) {
            console.warn('Returning empty DAO list due to API error:', err instanceof Error ? err.message : err);
            return [];
        }
    }
    async getProposalById(id) {
        const allDaos = await this.getDAOs();
        for (const dao of allDaos) {
            try {
                // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
                const res = await this.call(() => (0, client_1.proposal)(dao.id, id, this.sdkConfig));
                if (res)
                    return this.toLowercase(res);
            }
            catch (err) {
                // 404 means this DAO doesn't have the proposal — continue to next
                if (err?.status === 404 || err?.response?.status === 404)
                    continue;
                // other errors: log and continue
                console.warn(`[AnticaptureClient] Error fetching proposal ${id} from DAO ${dao.id}:`, err instanceof Error ? err.message : err);
            }
        }
        return null;
    }
    async listProposals(variables, daoId) {
        if (daoId) {
            try {
                // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
                const res = await this.call(() => (0, client_1.proposals)(daoId, this.toChecksum(variables ?? {}), this.sdkConfig));
                return this.toLowercase((0, schemas_1.processProposals)({ proposals: res }, daoId) ?? []);
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Error querying proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
                return [];
            }
        }
        const allDaos = await this.getDAOs();
        const all = [];
        for (const dao of allDaos) {
            try {
                // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
                const res = await this.call(() => (0, client_1.proposals)(dao.id, this.toChecksum(variables ?? {}), this.sdkConfig));
                const processed = (0, schemas_1.processProposals)({ proposals: res }, dao.id);
                if (processed?.length)
                    all.push(...processed);
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
            }
        }
        if (variables?.fromEndDate) {
            all.sort((a, b) => (b?.endTimestamp ?? 0) - (a?.endTimestamp ?? 0));
        }
        else {
            all.sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
        }
        return this.toLowercase(all);
    }
    async listVotingPowerHistory(variables, daoId) {
        if (daoId) {
            try {
                const res = await this.call(() => (0, client_1.historicalVotingPower)(daoId, this.toChecksum(variables ?? {}), this.sdkConfig));
                return this.toLowercase((0, schemas_1.processVotingPowerHistory)({ historicalVotingPower: res }, daoId));
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Error querying voting power history for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
                return [];
            }
        }
        const allDaos = await this.getDAOs();
        const promises = allDaos.map(async (dao) => {
            try {
                const res = await this.call(() => (0, client_1.historicalVotingPower)(dao.id, this.toChecksum(variables ?? {}), this.sdkConfig));
                return (0, schemas_1.processVotingPowerHistory)({ historicalVotingPower: res }, dao.id, dao.chainId);
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Skipping ${dao.id} due to API error: ${err instanceof Error ? err.message : err}`);
                return [];
            }
        });
        const results = await Promise.all(promises);
        return this.toLowercase(results.flat().sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)));
    }
    async listVotes(daoId, variables) {
        try {
            // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
            const res = await this.call(() => (0, client_1.votes)(daoId, this.toChecksum(variables ?? {}), this.sdkConfig));
            return this.toLowercase(res?.items ?? []);
        }
        catch (err) {
            console.warn(`[AnticaptureClient] Error fetching votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
            return [];
        }
    }
    async getProposalNonVoters(proposalId, daoId, addresses) {
        try {
            const params = addresses?.length ? { addresses } : {};
            // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
            const res = await this.call(() => (0, client_1.proposalNonVoters)(daoId, proposalId, this.toChecksum(params), this.sdkConfig));
            return this.toLowercase(res?.items ?? []);
        }
        catch (err) {
            console.warn(`[AnticaptureClient] Error fetching non-voters for proposal ${proposalId}:`, err instanceof Error ? err.message : err);
            return [];
        }
    }
    async getOffchainProposalNonVoters(proposalId, addresses) {
        const allDaos = await this.getDAOs();
        const offchainDaos = allDaos.filter(d => d.supportOffchainData);
        const params = addresses?.length ? { addresses } : {};
        for (const dao of offchainDaos) {
            try {
                // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
                const res = await this.call(() => (0, client_1.offchainProposalNonVoters)(dao.id, proposalId, this.toChecksum(params), this.sdkConfig));
                if (res?.items != null)
                    return this.toLowercase(res.items);
            }
            catch (err) {
                if (err?.status === 404 || err?.response?.status === 404)
                    continue;
                console.warn(`[AnticaptureClient] Error fetching offchain non-voters for proposal ${proposalId} from DAO ${dao.id}:`, err instanceof Error ? err.message : err);
            }
        }
        return [];
    }
    async listRecentVotesFromAllDaos(timestampGt, limit = 100) {
        const daos = await this.getDAOs();
        const voteArrays = await Promise.all(daos.map(async (dao) => {
            const vs = await this.listVotes(dao.id, {
                fromDate: parseInt(timestampGt),
                limit,
                orderBy: 'timestamp',
                orderDirection: 'asc',
            });
            return vs.map(v => ({ ...v, daoId: dao.id }));
        }));
        return voteArrays.flat().sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    }
    async getEventThreshold(daoId, type, relevance) {
        try {
            // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
            const res = await this.call(() => (0, client_1.getEventRelevanceThreshold)(daoId, { type, relevance }, this.sdkConfig));
            return res?.threshold ?? null;
        }
        catch (err) {
            console.warn(`[AnticaptureClient] Error fetching threshold for ${daoId}/${type}:`, err instanceof Error ? err.message : err);
            return null;
        }
    }
    async listOffchainProposals(variables, daoId) {
        if (daoId) {
            try {
                const res = await this.call(() => (0, client_1.offchainProposals)(daoId, this.toChecksum(variables ?? {}), this.sdkConfig));
                const items = (res?.items ?? []).map((i) => ({ ...i, daoId }));
                return this.toLowercase(items);
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Error querying offchain proposals for DAO ${daoId}: ${err instanceof Error ? err.message : err}`);
                return [];
            }
        }
        const allDaos = await this.getDAOs();
        const all = [];
        for (const dao of allDaos) {
            if (!dao.supportOffchainData)
                continue;
            try {
                const res = await this.call(() => (0, client_1.offchainProposals)(dao.id, this.toChecksum(variables ?? {}), this.sdkConfig));
                const items = (res?.items ?? []).map((i) => ({ ...i, daoId: dao.id }));
                if (items.length)
                    all.push(...items);
            }
            catch (err) {
                console.warn(`[AnticaptureClient] Skipping offchain proposals for ${dao.id}: ${err instanceof Error ? err.message : err}`);
            }
        }
        all.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
        return this.toLowercase(all);
    }
    async listOffchainVotes(daoId, variables) {
        try {
            // SDK dao param is a string-literal enum; DAO IDs come from runtime /daos response, so we cast
            const res = await this.call(() => (0, client_1.votesOffchain)(daoId, this.toChecksum(variables ?? {}), this.sdkConfig));
            return this.toLowercase(res?.items ?? []);
        }
        catch (err) {
            console.warn(`[AnticaptureClient] Error fetching offchain votes for DAO ${daoId}:`, err instanceof Error ? err.message : err);
            return [];
        }
    }
    async listRecentOffchainVotesFromAllDaos(fromDate, limit = 100) {
        const daos = await this.getDAOs();
        const voteArrays = await Promise.all(daos
            .filter(dao => dao.supportOffchainData)
            .map(async (dao) => {
            const vs = await this.listOffchainVotes(dao.id, {
                fromDate,
                limit,
                orderBy: 'timestamp',
                orderDirection: 'asc',
            });
            return vs.map(v => ({ ...v, daoId: dao.id }));
        }));
        return voteArrays.flat().sort((a, b) => (a.created ?? 0) - (b.created ?? 0));
    }
}
exports.AnticaptureClient = AnticaptureClient;
