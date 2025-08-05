"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListVotingPowerHistorysDocument = exports.ListProposalsDocument = exports.GetProposalByIdDocument = exports.GetDaOsDocument = exports.QueryInput_TotalAssets_Days = exports.QueryInput_Proposals_OrderDirection = exports.QueryInput_ProposalsActivity_UserVoteFilter = exports.QueryInput_ProposalsActivity_OrderDirection = exports.QueryInput_ProposalsActivity_OrderBy = exports.QueryInput_HistoricalVotingPower_Days = exports.QueryInput_HistoricalBalances_Days = exports.QueryInput_CompareVotes_Days = exports.QueryInput_CompareTreasury_Days = exports.QueryInput_CompareTotalSupply_Days = exports.QueryInput_CompareProposals_Days = exports.QueryInput_CompareLendingSupply_Days = exports.QueryInput_CompareDexSupply_Days = exports.QueryInput_CompareDelegatedSupply_Days = exports.QueryInput_CompareCirculatingSupply_Days = exports.QueryInput_CompareCexSupply_Days = exports.QueryInput_CompareAverageTurnout_Days = exports.QueryInput_CompareActiveSupply_Days = exports.MetricType = exports.HttpMethod = void 0;
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["Connect"] = "CONNECT";
    HttpMethod["Delete"] = "DELETE";
    HttpMethod["Get"] = "GET";
    HttpMethod["Head"] = "HEAD";
    HttpMethod["Options"] = "OPTIONS";
    HttpMethod["Patch"] = "PATCH";
    HttpMethod["Post"] = "POST";
    HttpMethod["Put"] = "PUT";
    HttpMethod["Trace"] = "TRACE";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
var MetricType;
(function (MetricType) {
    MetricType["CexSupply"] = "CEX_SUPPLY";
    MetricType["CirculatingSupply"] = "CIRCULATING_SUPPLY";
    MetricType["DelegatedSupply"] = "DELEGATED_SUPPLY";
    MetricType["DexSupply"] = "DEX_SUPPLY";
    MetricType["LendingSupply"] = "LENDING_SUPPLY";
    MetricType["TotalSupply"] = "TOTAL_SUPPLY";
    MetricType["Treasury"] = "TREASURY";
})(MetricType || (exports.MetricType = MetricType = {}));
var QueryInput_CompareActiveSupply_Days;
(function (QueryInput_CompareActiveSupply_Days) {
    QueryInput_CompareActiveSupply_Days["7d"] = "_7d";
    QueryInput_CompareActiveSupply_Days["30d"] = "_30d";
    QueryInput_CompareActiveSupply_Days["90d"] = "_90d";
    QueryInput_CompareActiveSupply_Days["180d"] = "_180d";
    QueryInput_CompareActiveSupply_Days["365d"] = "_365d";
})(QueryInput_CompareActiveSupply_Days || (exports.QueryInput_CompareActiveSupply_Days = QueryInput_CompareActiveSupply_Days = {}));
var QueryInput_CompareAverageTurnout_Days;
(function (QueryInput_CompareAverageTurnout_Days) {
    QueryInput_CompareAverageTurnout_Days["7d"] = "_7d";
    QueryInput_CompareAverageTurnout_Days["30d"] = "_30d";
    QueryInput_CompareAverageTurnout_Days["90d"] = "_90d";
    QueryInput_CompareAverageTurnout_Days["180d"] = "_180d";
    QueryInput_CompareAverageTurnout_Days["365d"] = "_365d";
})(QueryInput_CompareAverageTurnout_Days || (exports.QueryInput_CompareAverageTurnout_Days = QueryInput_CompareAverageTurnout_Days = {}));
var QueryInput_CompareCexSupply_Days;
(function (QueryInput_CompareCexSupply_Days) {
    QueryInput_CompareCexSupply_Days["7d"] = "_7d";
    QueryInput_CompareCexSupply_Days["30d"] = "_30d";
    QueryInput_CompareCexSupply_Days["90d"] = "_90d";
    QueryInput_CompareCexSupply_Days["180d"] = "_180d";
    QueryInput_CompareCexSupply_Days["365d"] = "_365d";
})(QueryInput_CompareCexSupply_Days || (exports.QueryInput_CompareCexSupply_Days = QueryInput_CompareCexSupply_Days = {}));
var QueryInput_CompareCirculatingSupply_Days;
(function (QueryInput_CompareCirculatingSupply_Days) {
    QueryInput_CompareCirculatingSupply_Days["7d"] = "_7d";
    QueryInput_CompareCirculatingSupply_Days["30d"] = "_30d";
    QueryInput_CompareCirculatingSupply_Days["90d"] = "_90d";
    QueryInput_CompareCirculatingSupply_Days["180d"] = "_180d";
    QueryInput_CompareCirculatingSupply_Days["365d"] = "_365d";
})(QueryInput_CompareCirculatingSupply_Days || (exports.QueryInput_CompareCirculatingSupply_Days = QueryInput_CompareCirculatingSupply_Days = {}));
var QueryInput_CompareDelegatedSupply_Days;
(function (QueryInput_CompareDelegatedSupply_Days) {
    QueryInput_CompareDelegatedSupply_Days["7d"] = "_7d";
    QueryInput_CompareDelegatedSupply_Days["30d"] = "_30d";
    QueryInput_CompareDelegatedSupply_Days["90d"] = "_90d";
    QueryInput_CompareDelegatedSupply_Days["180d"] = "_180d";
    QueryInput_CompareDelegatedSupply_Days["365d"] = "_365d";
})(QueryInput_CompareDelegatedSupply_Days || (exports.QueryInput_CompareDelegatedSupply_Days = QueryInput_CompareDelegatedSupply_Days = {}));
var QueryInput_CompareDexSupply_Days;
(function (QueryInput_CompareDexSupply_Days) {
    QueryInput_CompareDexSupply_Days["7d"] = "_7d";
    QueryInput_CompareDexSupply_Days["30d"] = "_30d";
    QueryInput_CompareDexSupply_Days["90d"] = "_90d";
    QueryInput_CompareDexSupply_Days["180d"] = "_180d";
    QueryInput_CompareDexSupply_Days["365d"] = "_365d";
})(QueryInput_CompareDexSupply_Days || (exports.QueryInput_CompareDexSupply_Days = QueryInput_CompareDexSupply_Days = {}));
var QueryInput_CompareLendingSupply_Days;
(function (QueryInput_CompareLendingSupply_Days) {
    QueryInput_CompareLendingSupply_Days["7d"] = "_7d";
    QueryInput_CompareLendingSupply_Days["30d"] = "_30d";
    QueryInput_CompareLendingSupply_Days["90d"] = "_90d";
    QueryInput_CompareLendingSupply_Days["180d"] = "_180d";
    QueryInput_CompareLendingSupply_Days["365d"] = "_365d";
})(QueryInput_CompareLendingSupply_Days || (exports.QueryInput_CompareLendingSupply_Days = QueryInput_CompareLendingSupply_Days = {}));
var QueryInput_CompareProposals_Days;
(function (QueryInput_CompareProposals_Days) {
    QueryInput_CompareProposals_Days["7d"] = "_7d";
    QueryInput_CompareProposals_Days["30d"] = "_30d";
    QueryInput_CompareProposals_Days["90d"] = "_90d";
    QueryInput_CompareProposals_Days["180d"] = "_180d";
    QueryInput_CompareProposals_Days["365d"] = "_365d";
})(QueryInput_CompareProposals_Days || (exports.QueryInput_CompareProposals_Days = QueryInput_CompareProposals_Days = {}));
var QueryInput_CompareTotalSupply_Days;
(function (QueryInput_CompareTotalSupply_Days) {
    QueryInput_CompareTotalSupply_Days["7d"] = "_7d";
    QueryInput_CompareTotalSupply_Days["30d"] = "_30d";
    QueryInput_CompareTotalSupply_Days["90d"] = "_90d";
    QueryInput_CompareTotalSupply_Days["180d"] = "_180d";
    QueryInput_CompareTotalSupply_Days["365d"] = "_365d";
})(QueryInput_CompareTotalSupply_Days || (exports.QueryInput_CompareTotalSupply_Days = QueryInput_CompareTotalSupply_Days = {}));
var QueryInput_CompareTreasury_Days;
(function (QueryInput_CompareTreasury_Days) {
    QueryInput_CompareTreasury_Days["7d"] = "_7d";
    QueryInput_CompareTreasury_Days["30d"] = "_30d";
    QueryInput_CompareTreasury_Days["90d"] = "_90d";
    QueryInput_CompareTreasury_Days["180d"] = "_180d";
    QueryInput_CompareTreasury_Days["365d"] = "_365d";
})(QueryInput_CompareTreasury_Days || (exports.QueryInput_CompareTreasury_Days = QueryInput_CompareTreasury_Days = {}));
var QueryInput_CompareVotes_Days;
(function (QueryInput_CompareVotes_Days) {
    QueryInput_CompareVotes_Days["7d"] = "_7d";
    QueryInput_CompareVotes_Days["30d"] = "_30d";
    QueryInput_CompareVotes_Days["90d"] = "_90d";
    QueryInput_CompareVotes_Days["180d"] = "_180d";
    QueryInput_CompareVotes_Days["365d"] = "_365d";
})(QueryInput_CompareVotes_Days || (exports.QueryInput_CompareVotes_Days = QueryInput_CompareVotes_Days = {}));
var QueryInput_HistoricalBalances_Days;
(function (QueryInput_HistoricalBalances_Days) {
    QueryInput_HistoricalBalances_Days["7d"] = "_7d";
    QueryInput_HistoricalBalances_Days["30d"] = "_30d";
    QueryInput_HistoricalBalances_Days["90d"] = "_90d";
    QueryInput_HistoricalBalances_Days["180d"] = "_180d";
    QueryInput_HistoricalBalances_Days["365d"] = "_365d";
})(QueryInput_HistoricalBalances_Days || (exports.QueryInput_HistoricalBalances_Days = QueryInput_HistoricalBalances_Days = {}));
var QueryInput_HistoricalVotingPower_Days;
(function (QueryInput_HistoricalVotingPower_Days) {
    QueryInput_HistoricalVotingPower_Days["7d"] = "_7d";
    QueryInput_HistoricalVotingPower_Days["30d"] = "_30d";
    QueryInput_HistoricalVotingPower_Days["90d"] = "_90d";
    QueryInput_HistoricalVotingPower_Days["180d"] = "_180d";
    QueryInput_HistoricalVotingPower_Days["365d"] = "_365d";
})(QueryInput_HistoricalVotingPower_Days || (exports.QueryInput_HistoricalVotingPower_Days = QueryInput_HistoricalVotingPower_Days = {}));
var QueryInput_ProposalsActivity_OrderBy;
(function (QueryInput_ProposalsActivity_OrderBy) {
    QueryInput_ProposalsActivity_OrderBy["Timestamp"] = "timestamp";
    QueryInput_ProposalsActivity_OrderBy["VoteTiming"] = "voteTiming";
    QueryInput_ProposalsActivity_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_ProposalsActivity_OrderBy || (exports.QueryInput_ProposalsActivity_OrderBy = QueryInput_ProposalsActivity_OrderBy = {}));
var QueryInput_ProposalsActivity_OrderDirection;
(function (QueryInput_ProposalsActivity_OrderDirection) {
    QueryInput_ProposalsActivity_OrderDirection["Asc"] = "asc";
    QueryInput_ProposalsActivity_OrderDirection["Desc"] = "desc";
})(QueryInput_ProposalsActivity_OrderDirection || (exports.QueryInput_ProposalsActivity_OrderDirection = QueryInput_ProposalsActivity_OrderDirection = {}));
/** Filter proposals by vote type. Can be: 'yes' (For votes), 'no' (Against votes), 'abstain' (Abstain votes), 'no-vote' (Didn't vote) */
var QueryInput_ProposalsActivity_UserVoteFilter;
(function (QueryInput_ProposalsActivity_UserVoteFilter) {
    QueryInput_ProposalsActivity_UserVoteFilter["Abstain"] = "abstain";
    QueryInput_ProposalsActivity_UserVoteFilter["No"] = "no";
    QueryInput_ProposalsActivity_UserVoteFilter["NoVote"] = "no_vote";
    QueryInput_ProposalsActivity_UserVoteFilter["Yes"] = "yes";
})(QueryInput_ProposalsActivity_UserVoteFilter || (exports.QueryInput_ProposalsActivity_UserVoteFilter = QueryInput_ProposalsActivity_UserVoteFilter = {}));
var QueryInput_Proposals_OrderDirection;
(function (QueryInput_Proposals_OrderDirection) {
    QueryInput_Proposals_OrderDirection["Asc"] = "asc";
    QueryInput_Proposals_OrderDirection["Desc"] = "desc";
})(QueryInput_Proposals_OrderDirection || (exports.QueryInput_Proposals_OrderDirection = QueryInput_Proposals_OrderDirection = {}));
var QueryInput_TotalAssets_Days;
(function (QueryInput_TotalAssets_Days) {
    QueryInput_TotalAssets_Days["7d"] = "_7d";
    QueryInput_TotalAssets_Days["30d"] = "_30d";
    QueryInput_TotalAssets_Days["90d"] = "_90d";
    QueryInput_TotalAssets_Days["180d"] = "_180d";
    QueryInput_TotalAssets_Days["365d"] = "_365d";
})(QueryInput_TotalAssets_Days || (exports.QueryInput_TotalAssets_Days = QueryInput_TotalAssets_Days = {}));
exports.GetDaOsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetDAOs" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "daos" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingDelay" } }] } }] } }] } }] };
exports.GetProposalByIdDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetProposalById" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposalsOnchain" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "targets" } }, { "kind": "Field", "name": { "kind": "Name", "value": "values" } }, { "kind": "Field", "name": { "kind": "Name", "value": "signatures" } }, { "kind": "Field", "name": { "kind": "Name", "value": "calldatas" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }] } }] } }] };
exports.ListProposalsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListProposals" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "where" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "proposalsOnchainFilter" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposalsOnchains" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "where" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "targets" } }, { "kind": "Field", "name": { "kind": "Name", "value": "values" } }, { "kind": "Field", "name": { "kind": "Name", "value": "signatures" } }, { "kind": "Field", "name": { "kind": "Name", "value": "calldatas" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }] } }] } }] } }] };
exports.ListVotingPowerHistorysDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListVotingPowerHistorys" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "where" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "votingPowerHistoryFilter" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "votingPowerHistorys" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "where" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "where" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "accountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delta" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "transactionHash" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delegation" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "delegatorAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delegatedValue" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "transfer" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "amount" } }, { "kind": "Field", "name": { "kind": "Name", "value": "fromAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "toAccountId" } }] } }] } }] } }] } }] };
