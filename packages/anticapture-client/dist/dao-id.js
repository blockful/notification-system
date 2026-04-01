"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toApiDaoId = toApiDaoId;
exports.toLegacyDaoId = toLegacyDaoId;
const daoAliasToApi = {
    AAVE: 'aave',
    COMP: 'comp',
    COMPOUND: 'comp',
    ENS: 'ens',
    GTC: 'gtc',
    NOUNS: 'nouns',
    OBOL: 'obol',
    SCR: 'scr',
    SCROLL: 'scr',
    UNI: 'uni',
    UNISWAP: 'uni',
};
const apiToLegacyDao = {
    aave: 'AAVE',
    comp: 'COMPOUND',
    ens: 'ENS',
    gtc: 'GTC',
    nouns: 'NOUNS',
    obol: 'OBOL',
    scr: 'SCR',
    uni: 'UNISWAP',
};
function toApiDaoId(daoId) {
    return daoAliasToApi[daoId.toUpperCase()] ?? daoId.toLowerCase();
}
function toLegacyDaoId(daoId) {
    return apiToLegacyDao[daoId.toLowerCase()] ?? daoId.toUpperCase();
}
