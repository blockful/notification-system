"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHistoricalVotingPowerDocument = exports.ListVotesDocument = exports.GetEventRelevanceThresholdDocument = exports.ListProposalsDocument = exports.GetProposalByIdDocument = exports.ProposalNonVotersDocument = exports.ListOffchainVotesDocument = exports.ListOffchainProposalsDocument = exports.OffchainProposalNonVotersDocument = exports.GetDaOsDocument = exports.QueryInput_VotingPowers_OrderBy = exports.QueryInput_Votes_OrderBy = exports.QueryInput_VotesOffchain_OrderBy = exports.QueryInput_VotesOffchainByProposalId_OrderBy = exports.QueryInput_VotesByProposalId_OrderBy = exports.QueryInput_Transfers_OrderBy = exports.QueryInput_Transactions_Includes_Items = exports.QueryInput_Transactions_AffectedSupply_Items = exports.QueryInput_Token_Currency = exports.QueryInput_TokenMetrics_MetricType = exports.QueryInput_Proposals_Status_Items = exports.QueryInput_ProposalsActivity_UserVoteFilter = exports.QueryInput_ProposalsActivity_OrderBy = exports.QueryInput_OffchainProposals_Status_Items = exports.QueryInput_LastUpdate_Chart = exports.QueryInput_HistoricalVotingPower_OrderBy = exports.QueryInput_HistoricalVotingPowerByAccountId_OrderBy = exports.QueryInput_HistoricalBalances_OrderBy = exports.QueryInput_FeedEvents_Type = exports.QueryInput_FeedEvents_Relevance = exports.QueryInput_FeedEvents_OrderBy = exports.QueryInput_Delegators_OrderBy = exports.QueryInput_AccountInteractions_OrderBy = exports.QueryInput_AccountBalances_OrderBy = exports.Ok_Const = exports.Error_Const = exports.OrderDirection = exports.HttpMethod = exports.FeedRelevance = exports.FeedEventType = exports.DaysWindow = void 0;
var DaysWindow;
(function (DaysWindow) {
    DaysWindow["7d"] = "_7d";
    DaysWindow["30d"] = "_30d";
    DaysWindow["90d"] = "_90d";
    DaysWindow["180d"] = "_180d";
    DaysWindow["365d"] = "_365d";
})(DaysWindow || (exports.DaysWindow = DaysWindow = {}));
/** Filter events by governance activity type. */
var FeedEventType;
(function (FeedEventType) {
    FeedEventType["Delegation"] = "DELEGATION";
    FeedEventType["Proposal"] = "PROPOSAL";
    FeedEventType["ProposalExtended"] = "PROPOSAL_EXTENDED";
    FeedEventType["Transfer"] = "TRANSFER";
    FeedEventType["Vote"] = "VOTE";
})(FeedEventType || (exports.FeedEventType = FeedEventType = {}));
/** Filter events by relevance tier. */
var FeedRelevance;
(function (FeedRelevance) {
    FeedRelevance["High"] = "HIGH";
    FeedRelevance["Low"] = "LOW";
    FeedRelevance["Medium"] = "MEDIUM";
})(FeedRelevance || (exports.FeedRelevance = FeedRelevance = {}));
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
/** Sort direction for ordered query results. */
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["Asc"] = "asc";
    OrderDirection["Desc"] = "desc";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
var Error_Const;
(function (Error_Const) {
    Error_Const["Error"] = "error";
})(Error_Const || (exports.Error_Const = Error_Const = {}));
var Ok_Const;
(function (Ok_Const) {
    Ok_Const["Ok"] = "ok";
})(Ok_Const || (exports.Ok_Const = Ok_Const = {}));
var QueryInput_AccountBalances_OrderBy;
(function (QueryInput_AccountBalances_OrderBy) {
    QueryInput_AccountBalances_OrderBy["Balance"] = "balance";
    QueryInput_AccountBalances_OrderBy["SignedVariation"] = "signedVariation";
    QueryInput_AccountBalances_OrderBy["Variation"] = "variation";
})(QueryInput_AccountBalances_OrderBy || (exports.QueryInput_AccountBalances_OrderBy = QueryInput_AccountBalances_OrderBy = {}));
/** Field used to sort interaction rows. */
var QueryInput_AccountInteractions_OrderBy;
(function (QueryInput_AccountInteractions_OrderBy) {
    QueryInput_AccountInteractions_OrderBy["Count"] = "count";
    QueryInput_AccountInteractions_OrderBy["Volume"] = "volume";
})(QueryInput_AccountInteractions_OrderBy || (exports.QueryInput_AccountInteractions_OrderBy = QueryInput_AccountInteractions_OrderBy = {}));
var QueryInput_Delegators_OrderBy;
(function (QueryInput_Delegators_OrderBy) {
    QueryInput_Delegators_OrderBy["Amount"] = "amount";
    QueryInput_Delegators_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_Delegators_OrderBy || (exports.QueryInput_Delegators_OrderBy = QueryInput_Delegators_OrderBy = {}));
/** Field used to sort feed events. */
var QueryInput_FeedEvents_OrderBy;
(function (QueryInput_FeedEvents_OrderBy) {
    QueryInput_FeedEvents_OrderBy["Timestamp"] = "timestamp";
    QueryInput_FeedEvents_OrderBy["Value"] = "value";
})(QueryInput_FeedEvents_OrderBy || (exports.QueryInput_FeedEvents_OrderBy = QueryInput_FeedEvents_OrderBy = {}));
/** Filter events by relevance tier. */
var QueryInput_FeedEvents_Relevance;
(function (QueryInput_FeedEvents_Relevance) {
    QueryInput_FeedEvents_Relevance["High"] = "HIGH";
    QueryInput_FeedEvents_Relevance["Low"] = "LOW";
    QueryInput_FeedEvents_Relevance["Medium"] = "MEDIUM";
})(QueryInput_FeedEvents_Relevance || (exports.QueryInput_FeedEvents_Relevance = QueryInput_FeedEvents_Relevance = {}));
/** Filter events by governance activity type. */
var QueryInput_FeedEvents_Type;
(function (QueryInput_FeedEvents_Type) {
    QueryInput_FeedEvents_Type["Delegation"] = "DELEGATION";
    QueryInput_FeedEvents_Type["Proposal"] = "PROPOSAL";
    QueryInput_FeedEvents_Type["ProposalExtended"] = "PROPOSAL_EXTENDED";
    QueryInput_FeedEvents_Type["Transfer"] = "TRANSFER";
    QueryInput_FeedEvents_Type["Vote"] = "VOTE";
})(QueryInput_FeedEvents_Type || (exports.QueryInput_FeedEvents_Type = QueryInput_FeedEvents_Type = {}));
/** Field used to sort historical balance rows. */
var QueryInput_HistoricalBalances_OrderBy;
(function (QueryInput_HistoricalBalances_OrderBy) {
    QueryInput_HistoricalBalances_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalBalances_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalBalances_OrderBy || (exports.QueryInput_HistoricalBalances_OrderBy = QueryInput_HistoricalBalances_OrderBy = {}));
/** Field used to sort historical voting power rows. */
var QueryInput_HistoricalVotingPowerByAccountId_OrderBy;
(function (QueryInput_HistoricalVotingPowerByAccountId_OrderBy) {
    QueryInput_HistoricalVotingPowerByAccountId_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalVotingPowerByAccountId_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalVotingPowerByAccountId_OrderBy || (exports.QueryInput_HistoricalVotingPowerByAccountId_OrderBy = QueryInput_HistoricalVotingPowerByAccountId_OrderBy = {}));
/** Field used to sort historical voting power rows. */
var QueryInput_HistoricalVotingPower_OrderBy;
(function (QueryInput_HistoricalVotingPower_OrderBy) {
    QueryInput_HistoricalVotingPower_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalVotingPower_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalVotingPower_OrderBy || (exports.QueryInput_HistoricalVotingPower_OrderBy = QueryInput_HistoricalVotingPower_OrderBy = {}));
/** Chart identifier whose freshness timestamp should be returned. */
var QueryInput_LastUpdate_Chart;
(function (QueryInput_LastUpdate_Chart) {
    QueryInput_LastUpdate_Chart["AttackProfitability"] = "attack_profitability";
    QueryInput_LastUpdate_Chart["CostComparison"] = "cost_comparison";
    QueryInput_LastUpdate_Chart["TokenDistribution"] = "token_distribution";
})(QueryInput_LastUpdate_Chart || (exports.QueryInput_LastUpdate_Chart = QueryInput_LastUpdate_Chart = {}));
var QueryInput_OffchainProposals_Status_Items;
(function (QueryInput_OffchainProposals_Status_Items) {
    QueryInput_OffchainProposals_Status_Items["Active"] = "active";
    QueryInput_OffchainProposals_Status_Items["Closed"] = "closed";
    QueryInput_OffchainProposals_Status_Items["Pending"] = "pending";
})(QueryInput_OffchainProposals_Status_Items || (exports.QueryInput_OffchainProposals_Status_Items = QueryInput_OffchainProposals_Status_Items = {}));
/** Field used to sort proposal activity results. */
var QueryInput_ProposalsActivity_OrderBy;
(function (QueryInput_ProposalsActivity_OrderBy) {
    QueryInput_ProposalsActivity_OrderBy["Timestamp"] = "timestamp";
    QueryInput_ProposalsActivity_OrderBy["VoteTiming"] = "voteTiming";
    QueryInput_ProposalsActivity_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_ProposalsActivity_OrderBy || (exports.QueryInput_ProposalsActivity_OrderBy = QueryInput_ProposalsActivity_OrderBy = {}));
/** Optional vote filter. Use yes, no, abstain, or no-vote to narrow the result set. */
var QueryInput_ProposalsActivity_UserVoteFilter;
(function (QueryInput_ProposalsActivity_UserVoteFilter) {
    QueryInput_ProposalsActivity_UserVoteFilter["Abstain"] = "abstain";
    QueryInput_ProposalsActivity_UserVoteFilter["No"] = "no";
    QueryInput_ProposalsActivity_UserVoteFilter["NoVote"] = "no_vote";
    QueryInput_ProposalsActivity_UserVoteFilter["Yes"] = "yes";
})(QueryInput_ProposalsActivity_UserVoteFilter || (exports.QueryInput_ProposalsActivity_UserVoteFilter = QueryInput_ProposalsActivity_UserVoteFilter = {}));
var QueryInput_Proposals_Status_Items;
(function (QueryInput_Proposals_Status_Items) {
    QueryInput_Proposals_Status_Items["Active"] = "ACTIVE";
    QueryInput_Proposals_Status_Items["Canceled"] = "CANCELED";
    QueryInput_Proposals_Status_Items["Defeated"] = "DEFEATED";
    QueryInput_Proposals_Status_Items["Executed"] = "EXECUTED";
    QueryInput_Proposals_Status_Items["Expired"] = "EXPIRED";
    QueryInput_Proposals_Status_Items["NoQuorum"] = "NO_QUORUM";
    QueryInput_Proposals_Status_Items["Pending"] = "PENDING";
    QueryInput_Proposals_Status_Items["PendingExecution"] = "PENDING_EXECUTION";
    QueryInput_Proposals_Status_Items["Queued"] = "QUEUED";
    QueryInput_Proposals_Status_Items["Succeeded"] = "SUCCEEDED";
    QueryInput_Proposals_Status_Items["Vetoed"] = "VETOED";
})(QueryInput_Proposals_Status_Items || (exports.QueryInput_Proposals_Status_Items = QueryInput_Proposals_Status_Items = {}));
/** Metric family to query. */
var QueryInput_TokenMetrics_MetricType;
(function (QueryInput_TokenMetrics_MetricType) {
    QueryInput_TokenMetrics_MetricType["CexSupply"] = "CEX_SUPPLY";
    QueryInput_TokenMetrics_MetricType["CirculatingSupply"] = "CIRCULATING_SUPPLY";
    QueryInput_TokenMetrics_MetricType["DelegatedSupply"] = "DELEGATED_SUPPLY";
    QueryInput_TokenMetrics_MetricType["DexSupply"] = "DEX_SUPPLY";
    QueryInput_TokenMetrics_MetricType["LendingSupply"] = "LENDING_SUPPLY";
    QueryInput_TokenMetrics_MetricType["TotalSupply"] = "TOTAL_SUPPLY";
    QueryInput_TokenMetrics_MetricType["Treasury"] = "TREASURY";
})(QueryInput_TokenMetrics_MetricType || (exports.QueryInput_TokenMetrics_MetricType = QueryInput_TokenMetrics_MetricType = {}));
/** Currency to use when fetching token price data. */
var QueryInput_Token_Currency;
(function (QueryInput_Token_Currency) {
    QueryInput_Token_Currency["Eth"] = "eth";
    QueryInput_Token_Currency["Usd"] = "usd";
})(QueryInput_Token_Currency || (exports.QueryInput_Token_Currency = QueryInput_Token_Currency = {}));
var QueryInput_Transactions_AffectedSupply_Items;
(function (QueryInput_Transactions_AffectedSupply_Items) {
    QueryInput_Transactions_AffectedSupply_Items["Cex"] = "CEX";
    QueryInput_Transactions_AffectedSupply_Items["Dex"] = "DEX";
    QueryInput_Transactions_AffectedSupply_Items["Lending"] = "LENDING";
    QueryInput_Transactions_AffectedSupply_Items["Total"] = "TOTAL";
    QueryInput_Transactions_AffectedSupply_Items["Unassigned"] = "UNASSIGNED";
})(QueryInput_Transactions_AffectedSupply_Items || (exports.QueryInput_Transactions_AffectedSupply_Items = QueryInput_Transactions_AffectedSupply_Items = {}));
var QueryInput_Transactions_Includes_Items;
(function (QueryInput_Transactions_Includes_Items) {
    QueryInput_Transactions_Includes_Items["Delegation"] = "DELEGATION";
    QueryInput_Transactions_Includes_Items["Transfer"] = "TRANSFER";
})(QueryInput_Transactions_Includes_Items || (exports.QueryInput_Transactions_Includes_Items = QueryInput_Transactions_Includes_Items = {}));
/** Field used to sort transfers. */
var QueryInput_Transfers_OrderBy;
(function (QueryInput_Transfers_OrderBy) {
    QueryInput_Transfers_OrderBy["Amount"] = "amount";
    QueryInput_Transfers_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_Transfers_OrderBy || (exports.QueryInput_Transfers_OrderBy = QueryInput_Transfers_OrderBy = {}));
/** Sort votes by timestamp or voting power. */
var QueryInput_VotesByProposalId_OrderBy;
(function (QueryInput_VotesByProposalId_OrderBy) {
    QueryInput_VotesByProposalId_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesByProposalId_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesByProposalId_OrderBy || (exports.QueryInput_VotesByProposalId_OrderBy = QueryInput_VotesByProposalId_OrderBy = {}));
/** Sort votes by timestamp or voting power. */
var QueryInput_VotesOffchainByProposalId_OrderBy;
(function (QueryInput_VotesOffchainByProposalId_OrderBy) {
    QueryInput_VotesOffchainByProposalId_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesOffchainByProposalId_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesOffchainByProposalId_OrderBy || (exports.QueryInput_VotesOffchainByProposalId_OrderBy = QueryInput_VotesOffchainByProposalId_OrderBy = {}));
/** Sort votes by timestamp or voting power. */
var QueryInput_VotesOffchain_OrderBy;
(function (QueryInput_VotesOffchain_OrderBy) {
    QueryInput_VotesOffchain_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesOffchain_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesOffchain_OrderBy || (exports.QueryInput_VotesOffchain_OrderBy = QueryInput_VotesOffchain_OrderBy = {}));
/** Sort votes by timestamp or voting power. */
var QueryInput_Votes_OrderBy;
(function (QueryInput_Votes_OrderBy) {
    QueryInput_Votes_OrderBy["Timestamp"] = "timestamp";
    QueryInput_Votes_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_Votes_OrderBy || (exports.QueryInput_Votes_OrderBy = QueryInput_Votes_OrderBy = {}));
var QueryInput_VotingPowers_OrderBy;
(function (QueryInput_VotingPowers_OrderBy) {
    QueryInput_VotingPowers_OrderBy["Balance"] = "balance";
    QueryInput_VotingPowers_OrderBy["DelegationsCount"] = "delegationsCount";
    QueryInput_VotingPowers_OrderBy["SignedVariation"] = "signedVariation";
    QueryInput_VotingPowers_OrderBy["Total"] = "total";
    QueryInput_VotingPowers_OrderBy["Variation"] = "variation";
    QueryInput_VotingPowers_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotingPowers_OrderBy || (exports.QueryInput_VotingPowers_OrderBy = QueryInput_VotingPowers_OrderBy = {}));
exports.GetDaOsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetDAOs" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "daos" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingDelay" } }, { "kind": "Field", "name": { "kind": "Name", "value": "chainId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "alreadySupportCalldataReview" } }, { "kind": "Field", "name": { "kind": "Name", "value": "supportOffchainData" } }] } }] } }] } }] };
exports.OffchainProposalNonVotersDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "OffchainProposalNonVoters" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "offchainProposalNonVoters" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "addresses" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "InlineFragment", "typeCondition": { "kind": "NamedType", "name": { "kind": "Name", "value": "OffchainVotersResponse" } }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voter" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }] } }] } }] } }] } }] };
exports.ListOffchainProposalsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListOffchainProposals" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_offchainProposals_status_items" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "endDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "offchainProposals" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "status" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "endDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "endDate" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "discussion" } }, { "kind": "Field", "name": { "kind": "Name", "value": "link" } }, { "kind": "Field", "name": { "kind": "Name", "value": "state" } }, { "kind": "Field", "name": { "kind": "Name", "value": "created" } }, { "kind": "Field", "name": { "kind": "Name", "value": "end" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ListOffchainVotesDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListOffchainVotes" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votesOffchain_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddresses" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "votesOffchain" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "toDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "voterAddresses" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddresses" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voter" } }, { "kind": "Field", "name": { "kind": "Name", "value": "created" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalTitle" } }, { "kind": "Field", "name": { "kind": "Name", "value": "reason" } }, { "kind": "Field", "name": { "kind": "Name", "value": "vp" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ProposalNonVotersDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ProposalNonVoters" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposalNonVoters" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "addresses" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voter" } }] } }] } }] } }] };
exports.GetProposalByIdDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetProposalById" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposal" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "InlineFragment", "typeCondition": { "kind": "NamedType", "name": { "kind": "Name", "value": "OnchainProposal" } }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endTimestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "txHash" } }] } }] } }] } }] };
exports.ListProposalsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListProposals" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_proposals_status_items" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromEndDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "includeOptimisticProposals" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Boolean" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposals" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "status" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromEndDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromEndDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "includeOptimisticProposals" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "includeOptimisticProposals" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endTimestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "txHash" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.GetEventRelevanceThresholdDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetEventRelevanceThreshold" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "relevance" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "FeedRelevance" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "type" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "FeedEventType" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "getEventRelevanceThreshold" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "relevance" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "relevance" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "type" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "type" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "threshold" } }] } }] } }] };
exports.ListVotesDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListVotes" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddressIn" } }, "type": { "kind": "ListType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votes_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "support" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "votes" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "voterAddressIn" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddressIn" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "toDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "support" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "support" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "transactionHash" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "voterAddress" } }, { "kind": "Field", "name": { "kind": "Name", "value": "support" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "reason" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalTitle" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ListHistoricalVotingPowerDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListHistoricalVotingPower" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_historicalVotingPower_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "OrderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "address" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "historicalVotingPower" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "address" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "address" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "accountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delta" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "transactionHash" } }, { "kind": "Field", "name": { "kind": "Name", "value": "logIndex" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delegation" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "from" } }, { "kind": "Field", "name": { "kind": "Name", "value": "to" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }, { "kind": "Field", "name": { "kind": "Name", "value": "previousDelegate" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "transfer" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "from" } }, { "kind": "Field", "name": { "kind": "Name", "value": "to" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }] } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
