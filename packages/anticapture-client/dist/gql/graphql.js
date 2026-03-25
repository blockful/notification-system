"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryInput_Token_Currency = exports.QueryInput_TokenMetrics_OrderDirection = exports.QueryInput_TokenMetrics_MetricType = exports.QueryInput_Proposals_OrderDirection = exports.QueryInput_Proposals_IncludeOptimisticProposals = exports.QueryInput_ProposalsActivity_UserVoteFilter = exports.QueryInput_ProposalsActivity_OrderDirection = exports.QueryInput_ProposalsActivity_OrderBy = exports.QueryInput_ProposalNonVoters_OrderDirection = exports.QueryInput_OffchainProposals_OrderDirection = exports.QueryInput_LastUpdate_Chart = exports.QueryInput_HistoricalVotingPower_OrderDirection = exports.QueryInput_HistoricalVotingPower_OrderBy = exports.QueryInput_HistoricalVotingPowerByAccountId_OrderDirection = exports.QueryInput_HistoricalVotingPowerByAccountId_OrderBy = exports.QueryInput_HistoricalDelegations_OrderDirection = exports.QueryInput_HistoricalBalances_OrderDirection = exports.QueryInput_HistoricalBalances_OrderBy = exports.QueryInput_GetTotalTreasury_Order = exports.QueryInput_GetTotalTreasury_Days = exports.QueryInput_GetLiquidTreasury_Order = exports.QueryInput_GetLiquidTreasury_Days = exports.QueryInput_GetEventRelevanceThreshold_Type = exports.QueryInput_GetEventRelevanceThreshold_Relevance = exports.QueryInput_GetDaoTokenTreasury_Order = exports.QueryInput_GetDaoTokenTreasury_Days = exports.QueryInput_FeedEvents_Type = exports.QueryInput_FeedEvents_Relevance = exports.QueryInput_FeedEvents_OrderDirection = exports.QueryInput_FeedEvents_OrderBy = exports.QueryInput_Delegators_OrderDirection = exports.QueryInput_Delegators_OrderBy = exports.QueryInput_DelegationPercentageByDay_OrderDirection = exports.QueryInput_CompareVotes_Days = exports.QueryInput_CompareTreasury_Days = exports.QueryInput_CompareTotalSupply_Days = exports.QueryInput_CompareProposals_Days = exports.QueryInput_CompareLendingSupply_Days = exports.QueryInput_CompareDexSupply_Days = exports.QueryInput_CompareDelegatedSupply_Days = exports.QueryInput_CompareCirculatingSupply_Days = exports.QueryInput_CompareCexSupply_Days = exports.QueryInput_CompareAverageTurnout_Days = exports.QueryInput_CompareActiveSupply_Days = exports.QueryInput_AccountInteractions_OrderDirection = exports.QueryInput_AccountInteractions_OrderBy = exports.QueryInput_AccountBalances_OrderDirection = exports.QueryInput_AccountBalances_OrderBy = exports.QueryInput_AccountBalanceVariations_OrderDirection = exports.HttpMethod = void 0;
exports.ListHistoricalVotingPowerDocument = exports.ListOffchainVotesDocument = exports.ListVotesDocument = exports.GetEventRelevanceThresholdDocument = exports.ListProposalsDocument = exports.GetProposalByIdDocument = exports.ProposalNonVotersDocument = exports.ListOffchainProposalsDocument = exports.GetDaOsDocument = exports.Timestamp_Const = exports.Query_FeedEvents_Items_Items_Type = exports.Query_FeedEvents_Items_Items_Relevance = exports.QueryInput_VotingPowers_OrderDirection = exports.QueryInput_VotingPowers_OrderBy = exports.QueryInput_VotingPowerVariations_OrderDirection = exports.QueryInput_Votes_OrderDirection = exports.QueryInput_Votes_OrderBy = exports.QueryInput_VotesOffchain_OrderDirection = exports.QueryInput_VotesOffchain_OrderBy = exports.QueryInput_VotesOffchainByProposalId_OrderDirection = exports.QueryInput_VotesOffchainByProposalId_OrderBy = exports.QueryInput_VotesByProposalId_OrderDirection = exports.QueryInput_VotesByProposalId_OrderBy = exports.QueryInput_Transfers_SortOrder = exports.QueryInput_Transfers_SortBy = exports.QueryInput_Transactions_SortOrder = void 0;
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
var QueryInput_AccountBalanceVariations_OrderDirection;
(function (QueryInput_AccountBalanceVariations_OrderDirection) {
    QueryInput_AccountBalanceVariations_OrderDirection["Asc"] = "asc";
    QueryInput_AccountBalanceVariations_OrderDirection["Desc"] = "desc";
})(QueryInput_AccountBalanceVariations_OrderDirection || (exports.QueryInput_AccountBalanceVariations_OrderDirection = QueryInput_AccountBalanceVariations_OrderDirection = {}));
var QueryInput_AccountBalances_OrderBy;
(function (QueryInput_AccountBalances_OrderBy) {
    QueryInput_AccountBalances_OrderBy["Balance"] = "balance";
    QueryInput_AccountBalances_OrderBy["SignedVariation"] = "signedVariation";
    QueryInput_AccountBalances_OrderBy["Variation"] = "variation";
})(QueryInput_AccountBalances_OrderBy || (exports.QueryInput_AccountBalances_OrderBy = QueryInput_AccountBalances_OrderBy = {}));
var QueryInput_AccountBalances_OrderDirection;
(function (QueryInput_AccountBalances_OrderDirection) {
    QueryInput_AccountBalances_OrderDirection["Asc"] = "asc";
    QueryInput_AccountBalances_OrderDirection["Desc"] = "desc";
})(QueryInput_AccountBalances_OrderDirection || (exports.QueryInput_AccountBalances_OrderDirection = QueryInput_AccountBalances_OrderDirection = {}));
var QueryInput_AccountInteractions_OrderBy;
(function (QueryInput_AccountInteractions_OrderBy) {
    QueryInput_AccountInteractions_OrderBy["Count"] = "count";
    QueryInput_AccountInteractions_OrderBy["Volume"] = "volume";
})(QueryInput_AccountInteractions_OrderBy || (exports.QueryInput_AccountInteractions_OrderBy = QueryInput_AccountInteractions_OrderBy = {}));
var QueryInput_AccountInteractions_OrderDirection;
(function (QueryInput_AccountInteractions_OrderDirection) {
    QueryInput_AccountInteractions_OrderDirection["Asc"] = "asc";
    QueryInput_AccountInteractions_OrderDirection["Desc"] = "desc";
})(QueryInput_AccountInteractions_OrderDirection || (exports.QueryInput_AccountInteractions_OrderDirection = QueryInput_AccountInteractions_OrderDirection = {}));
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
var QueryInput_DelegationPercentageByDay_OrderDirection;
(function (QueryInput_DelegationPercentageByDay_OrderDirection) {
    QueryInput_DelegationPercentageByDay_OrderDirection["Asc"] = "asc";
    QueryInput_DelegationPercentageByDay_OrderDirection["Desc"] = "desc";
})(QueryInput_DelegationPercentageByDay_OrderDirection || (exports.QueryInput_DelegationPercentageByDay_OrderDirection = QueryInput_DelegationPercentageByDay_OrderDirection = {}));
var QueryInput_Delegators_OrderBy;
(function (QueryInput_Delegators_OrderBy) {
    QueryInput_Delegators_OrderBy["Amount"] = "amount";
    QueryInput_Delegators_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_Delegators_OrderBy || (exports.QueryInput_Delegators_OrderBy = QueryInput_Delegators_OrderBy = {}));
var QueryInput_Delegators_OrderDirection;
(function (QueryInput_Delegators_OrderDirection) {
    QueryInput_Delegators_OrderDirection["Asc"] = "asc";
    QueryInput_Delegators_OrderDirection["Desc"] = "desc";
})(QueryInput_Delegators_OrderDirection || (exports.QueryInput_Delegators_OrderDirection = QueryInput_Delegators_OrderDirection = {}));
var QueryInput_FeedEvents_OrderBy;
(function (QueryInput_FeedEvents_OrderBy) {
    QueryInput_FeedEvents_OrderBy["Timestamp"] = "timestamp";
    QueryInput_FeedEvents_OrderBy["Value"] = "value";
})(QueryInput_FeedEvents_OrderBy || (exports.QueryInput_FeedEvents_OrderBy = QueryInput_FeedEvents_OrderBy = {}));
var QueryInput_FeedEvents_OrderDirection;
(function (QueryInput_FeedEvents_OrderDirection) {
    QueryInput_FeedEvents_OrderDirection["Asc"] = "asc";
    QueryInput_FeedEvents_OrderDirection["Desc"] = "desc";
})(QueryInput_FeedEvents_OrderDirection || (exports.QueryInput_FeedEvents_OrderDirection = QueryInput_FeedEvents_OrderDirection = {}));
var QueryInput_FeedEvents_Relevance;
(function (QueryInput_FeedEvents_Relevance) {
    QueryInput_FeedEvents_Relevance["High"] = "HIGH";
    QueryInput_FeedEvents_Relevance["Low"] = "LOW";
    QueryInput_FeedEvents_Relevance["Medium"] = "MEDIUM";
})(QueryInput_FeedEvents_Relevance || (exports.QueryInput_FeedEvents_Relevance = QueryInput_FeedEvents_Relevance = {}));
var QueryInput_FeedEvents_Type;
(function (QueryInput_FeedEvents_Type) {
    QueryInput_FeedEvents_Type["Delegation"] = "DELEGATION";
    QueryInput_FeedEvents_Type["Proposal"] = "PROPOSAL";
    QueryInput_FeedEvents_Type["ProposalExtended"] = "PROPOSAL_EXTENDED";
    QueryInput_FeedEvents_Type["Transfer"] = "TRANSFER";
    QueryInput_FeedEvents_Type["Vote"] = "VOTE";
})(QueryInput_FeedEvents_Type || (exports.QueryInput_FeedEvents_Type = QueryInput_FeedEvents_Type = {}));
var QueryInput_GetDaoTokenTreasury_Days;
(function (QueryInput_GetDaoTokenTreasury_Days) {
    QueryInput_GetDaoTokenTreasury_Days["7d"] = "_7d";
    QueryInput_GetDaoTokenTreasury_Days["30d"] = "_30d";
    QueryInput_GetDaoTokenTreasury_Days["90d"] = "_90d";
    QueryInput_GetDaoTokenTreasury_Days["180d"] = "_180d";
    QueryInput_GetDaoTokenTreasury_Days["365d"] = "_365d";
})(QueryInput_GetDaoTokenTreasury_Days || (exports.QueryInput_GetDaoTokenTreasury_Days = QueryInput_GetDaoTokenTreasury_Days = {}));
var QueryInput_GetDaoTokenTreasury_Order;
(function (QueryInput_GetDaoTokenTreasury_Order) {
    QueryInput_GetDaoTokenTreasury_Order["Asc"] = "asc";
    QueryInput_GetDaoTokenTreasury_Order["Desc"] = "desc";
})(QueryInput_GetDaoTokenTreasury_Order || (exports.QueryInput_GetDaoTokenTreasury_Order = QueryInput_GetDaoTokenTreasury_Order = {}));
var QueryInput_GetEventRelevanceThreshold_Relevance;
(function (QueryInput_GetEventRelevanceThreshold_Relevance) {
    QueryInput_GetEventRelevanceThreshold_Relevance["High"] = "HIGH";
    QueryInput_GetEventRelevanceThreshold_Relevance["Low"] = "LOW";
    QueryInput_GetEventRelevanceThreshold_Relevance["Medium"] = "MEDIUM";
})(QueryInput_GetEventRelevanceThreshold_Relevance || (exports.QueryInput_GetEventRelevanceThreshold_Relevance = QueryInput_GetEventRelevanceThreshold_Relevance = {}));
var QueryInput_GetEventRelevanceThreshold_Type;
(function (QueryInput_GetEventRelevanceThreshold_Type) {
    QueryInput_GetEventRelevanceThreshold_Type["Delegation"] = "DELEGATION";
    QueryInput_GetEventRelevanceThreshold_Type["Proposal"] = "PROPOSAL";
    QueryInput_GetEventRelevanceThreshold_Type["ProposalExtended"] = "PROPOSAL_EXTENDED";
    QueryInput_GetEventRelevanceThreshold_Type["Transfer"] = "TRANSFER";
    QueryInput_GetEventRelevanceThreshold_Type["Vote"] = "VOTE";
})(QueryInput_GetEventRelevanceThreshold_Type || (exports.QueryInput_GetEventRelevanceThreshold_Type = QueryInput_GetEventRelevanceThreshold_Type = {}));
var QueryInput_GetLiquidTreasury_Days;
(function (QueryInput_GetLiquidTreasury_Days) {
    QueryInput_GetLiquidTreasury_Days["7d"] = "_7d";
    QueryInput_GetLiquidTreasury_Days["30d"] = "_30d";
    QueryInput_GetLiquidTreasury_Days["90d"] = "_90d";
    QueryInput_GetLiquidTreasury_Days["180d"] = "_180d";
    QueryInput_GetLiquidTreasury_Days["365d"] = "_365d";
})(QueryInput_GetLiquidTreasury_Days || (exports.QueryInput_GetLiquidTreasury_Days = QueryInput_GetLiquidTreasury_Days = {}));
var QueryInput_GetLiquidTreasury_Order;
(function (QueryInput_GetLiquidTreasury_Order) {
    QueryInput_GetLiquidTreasury_Order["Asc"] = "asc";
    QueryInput_GetLiquidTreasury_Order["Desc"] = "desc";
})(QueryInput_GetLiquidTreasury_Order || (exports.QueryInput_GetLiquidTreasury_Order = QueryInput_GetLiquidTreasury_Order = {}));
var QueryInput_GetTotalTreasury_Days;
(function (QueryInput_GetTotalTreasury_Days) {
    QueryInput_GetTotalTreasury_Days["7d"] = "_7d";
    QueryInput_GetTotalTreasury_Days["30d"] = "_30d";
    QueryInput_GetTotalTreasury_Days["90d"] = "_90d";
    QueryInput_GetTotalTreasury_Days["180d"] = "_180d";
    QueryInput_GetTotalTreasury_Days["365d"] = "_365d";
})(QueryInput_GetTotalTreasury_Days || (exports.QueryInput_GetTotalTreasury_Days = QueryInput_GetTotalTreasury_Days = {}));
var QueryInput_GetTotalTreasury_Order;
(function (QueryInput_GetTotalTreasury_Order) {
    QueryInput_GetTotalTreasury_Order["Asc"] = "asc";
    QueryInput_GetTotalTreasury_Order["Desc"] = "desc";
})(QueryInput_GetTotalTreasury_Order || (exports.QueryInput_GetTotalTreasury_Order = QueryInput_GetTotalTreasury_Order = {}));
var QueryInput_HistoricalBalances_OrderBy;
(function (QueryInput_HistoricalBalances_OrderBy) {
    QueryInput_HistoricalBalances_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalBalances_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalBalances_OrderBy || (exports.QueryInput_HistoricalBalances_OrderBy = QueryInput_HistoricalBalances_OrderBy = {}));
var QueryInput_HistoricalBalances_OrderDirection;
(function (QueryInput_HistoricalBalances_OrderDirection) {
    QueryInput_HistoricalBalances_OrderDirection["Asc"] = "asc";
    QueryInput_HistoricalBalances_OrderDirection["Desc"] = "desc";
})(QueryInput_HistoricalBalances_OrderDirection || (exports.QueryInput_HistoricalBalances_OrderDirection = QueryInput_HistoricalBalances_OrderDirection = {}));
var QueryInput_HistoricalDelegations_OrderDirection;
(function (QueryInput_HistoricalDelegations_OrderDirection) {
    QueryInput_HistoricalDelegations_OrderDirection["Asc"] = "asc";
    QueryInput_HistoricalDelegations_OrderDirection["Desc"] = "desc";
})(QueryInput_HistoricalDelegations_OrderDirection || (exports.QueryInput_HistoricalDelegations_OrderDirection = QueryInput_HistoricalDelegations_OrderDirection = {}));
var QueryInput_HistoricalVotingPowerByAccountId_OrderBy;
(function (QueryInput_HistoricalVotingPowerByAccountId_OrderBy) {
    QueryInput_HistoricalVotingPowerByAccountId_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalVotingPowerByAccountId_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalVotingPowerByAccountId_OrderBy || (exports.QueryInput_HistoricalVotingPowerByAccountId_OrderBy = QueryInput_HistoricalVotingPowerByAccountId_OrderBy = {}));
var QueryInput_HistoricalVotingPowerByAccountId_OrderDirection;
(function (QueryInput_HistoricalVotingPowerByAccountId_OrderDirection) {
    QueryInput_HistoricalVotingPowerByAccountId_OrderDirection["Asc"] = "asc";
    QueryInput_HistoricalVotingPowerByAccountId_OrderDirection["Desc"] = "desc";
})(QueryInput_HistoricalVotingPowerByAccountId_OrderDirection || (exports.QueryInput_HistoricalVotingPowerByAccountId_OrderDirection = QueryInput_HistoricalVotingPowerByAccountId_OrderDirection = {}));
var QueryInput_HistoricalVotingPower_OrderBy;
(function (QueryInput_HistoricalVotingPower_OrderBy) {
    QueryInput_HistoricalVotingPower_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalVotingPower_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalVotingPower_OrderBy || (exports.QueryInput_HistoricalVotingPower_OrderBy = QueryInput_HistoricalVotingPower_OrderBy = {}));
var QueryInput_HistoricalVotingPower_OrderDirection;
(function (QueryInput_HistoricalVotingPower_OrderDirection) {
    QueryInput_HistoricalVotingPower_OrderDirection["Asc"] = "asc";
    QueryInput_HistoricalVotingPower_OrderDirection["Desc"] = "desc";
})(QueryInput_HistoricalVotingPower_OrderDirection || (exports.QueryInput_HistoricalVotingPower_OrderDirection = QueryInput_HistoricalVotingPower_OrderDirection = {}));
var QueryInput_LastUpdate_Chart;
(function (QueryInput_LastUpdate_Chart) {
    QueryInput_LastUpdate_Chart["AttackProfitability"] = "attack_profitability";
    QueryInput_LastUpdate_Chart["CostComparison"] = "cost_comparison";
    QueryInput_LastUpdate_Chart["TokenDistribution"] = "token_distribution";
})(QueryInput_LastUpdate_Chart || (exports.QueryInput_LastUpdate_Chart = QueryInput_LastUpdate_Chart = {}));
var QueryInput_OffchainProposals_OrderDirection;
(function (QueryInput_OffchainProposals_OrderDirection) {
    QueryInput_OffchainProposals_OrderDirection["Asc"] = "asc";
    QueryInput_OffchainProposals_OrderDirection["Desc"] = "desc";
})(QueryInput_OffchainProposals_OrderDirection || (exports.QueryInput_OffchainProposals_OrderDirection = QueryInput_OffchainProposals_OrderDirection = {}));
var QueryInput_ProposalNonVoters_OrderDirection;
(function (QueryInput_ProposalNonVoters_OrderDirection) {
    QueryInput_ProposalNonVoters_OrderDirection["Asc"] = "asc";
    QueryInput_ProposalNonVoters_OrderDirection["Desc"] = "desc";
})(QueryInput_ProposalNonVoters_OrderDirection || (exports.QueryInput_ProposalNonVoters_OrderDirection = QueryInput_ProposalNonVoters_OrderDirection = {}));
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
var QueryInput_Proposals_IncludeOptimisticProposals;
(function (QueryInput_Proposals_IncludeOptimisticProposals) {
    QueryInput_Proposals_IncludeOptimisticProposals["False"] = "FALSE";
    QueryInput_Proposals_IncludeOptimisticProposals["True"] = "TRUE";
})(QueryInput_Proposals_IncludeOptimisticProposals || (exports.QueryInput_Proposals_IncludeOptimisticProposals = QueryInput_Proposals_IncludeOptimisticProposals = {}));
var QueryInput_Proposals_OrderDirection;
(function (QueryInput_Proposals_OrderDirection) {
    QueryInput_Proposals_OrderDirection["Asc"] = "asc";
    QueryInput_Proposals_OrderDirection["Desc"] = "desc";
})(QueryInput_Proposals_OrderDirection || (exports.QueryInput_Proposals_OrderDirection = QueryInput_Proposals_OrderDirection = {}));
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
var QueryInput_TokenMetrics_OrderDirection;
(function (QueryInput_TokenMetrics_OrderDirection) {
    QueryInput_TokenMetrics_OrderDirection["Asc"] = "asc";
    QueryInput_TokenMetrics_OrderDirection["Desc"] = "desc";
})(QueryInput_TokenMetrics_OrderDirection || (exports.QueryInput_TokenMetrics_OrderDirection = QueryInput_TokenMetrics_OrderDirection = {}));
var QueryInput_Token_Currency;
(function (QueryInput_Token_Currency) {
    QueryInput_Token_Currency["Eth"] = "eth";
    QueryInput_Token_Currency["Usd"] = "usd";
})(QueryInput_Token_Currency || (exports.QueryInput_Token_Currency = QueryInput_Token_Currency = {}));
var QueryInput_Transactions_SortOrder;
(function (QueryInput_Transactions_SortOrder) {
    QueryInput_Transactions_SortOrder["Asc"] = "asc";
    QueryInput_Transactions_SortOrder["Desc"] = "desc";
})(QueryInput_Transactions_SortOrder || (exports.QueryInput_Transactions_SortOrder = QueryInput_Transactions_SortOrder = {}));
var QueryInput_Transfers_SortBy;
(function (QueryInput_Transfers_SortBy) {
    QueryInput_Transfers_SortBy["Amount"] = "amount";
    QueryInput_Transfers_SortBy["Timestamp"] = "timestamp";
})(QueryInput_Transfers_SortBy || (exports.QueryInput_Transfers_SortBy = QueryInput_Transfers_SortBy = {}));
var QueryInput_Transfers_SortOrder;
(function (QueryInput_Transfers_SortOrder) {
    QueryInput_Transfers_SortOrder["Asc"] = "asc";
    QueryInput_Transfers_SortOrder["Desc"] = "desc";
})(QueryInput_Transfers_SortOrder || (exports.QueryInput_Transfers_SortOrder = QueryInput_Transfers_SortOrder = {}));
var QueryInput_VotesByProposalId_OrderBy;
(function (QueryInput_VotesByProposalId_OrderBy) {
    QueryInput_VotesByProposalId_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesByProposalId_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesByProposalId_OrderBy || (exports.QueryInput_VotesByProposalId_OrderBy = QueryInput_VotesByProposalId_OrderBy = {}));
var QueryInput_VotesByProposalId_OrderDirection;
(function (QueryInput_VotesByProposalId_OrderDirection) {
    QueryInput_VotesByProposalId_OrderDirection["Asc"] = "asc";
    QueryInput_VotesByProposalId_OrderDirection["Desc"] = "desc";
})(QueryInput_VotesByProposalId_OrderDirection || (exports.QueryInput_VotesByProposalId_OrderDirection = QueryInput_VotesByProposalId_OrderDirection = {}));
var QueryInput_VotesOffchainByProposalId_OrderBy;
(function (QueryInput_VotesOffchainByProposalId_OrderBy) {
    QueryInput_VotesOffchainByProposalId_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesOffchainByProposalId_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesOffchainByProposalId_OrderBy || (exports.QueryInput_VotesOffchainByProposalId_OrderBy = QueryInput_VotesOffchainByProposalId_OrderBy = {}));
var QueryInput_VotesOffchainByProposalId_OrderDirection;
(function (QueryInput_VotesOffchainByProposalId_OrderDirection) {
    QueryInput_VotesOffchainByProposalId_OrderDirection["Asc"] = "asc";
    QueryInput_VotesOffchainByProposalId_OrderDirection["Desc"] = "desc";
})(QueryInput_VotesOffchainByProposalId_OrderDirection || (exports.QueryInput_VotesOffchainByProposalId_OrderDirection = QueryInput_VotesOffchainByProposalId_OrderDirection = {}));
var QueryInput_VotesOffchain_OrderBy;
(function (QueryInput_VotesOffchain_OrderBy) {
    QueryInput_VotesOffchain_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesOffchain_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesOffchain_OrderBy || (exports.QueryInput_VotesOffchain_OrderBy = QueryInput_VotesOffchain_OrderBy = {}));
var QueryInput_VotesOffchain_OrderDirection;
(function (QueryInput_VotesOffchain_OrderDirection) {
    QueryInput_VotesOffchain_OrderDirection["Asc"] = "asc";
    QueryInput_VotesOffchain_OrderDirection["Desc"] = "desc";
})(QueryInput_VotesOffchain_OrderDirection || (exports.QueryInput_VotesOffchain_OrderDirection = QueryInput_VotesOffchain_OrderDirection = {}));
var QueryInput_Votes_OrderBy;
(function (QueryInput_Votes_OrderBy) {
    QueryInput_Votes_OrderBy["Timestamp"] = "timestamp";
    QueryInput_Votes_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_Votes_OrderBy || (exports.QueryInput_Votes_OrderBy = QueryInput_Votes_OrderBy = {}));
var QueryInput_Votes_OrderDirection;
(function (QueryInput_Votes_OrderDirection) {
    QueryInput_Votes_OrderDirection["Asc"] = "asc";
    QueryInput_Votes_OrderDirection["Desc"] = "desc";
})(QueryInput_Votes_OrderDirection || (exports.QueryInput_Votes_OrderDirection = QueryInput_Votes_OrderDirection = {}));
var QueryInput_VotingPowerVariations_OrderDirection;
(function (QueryInput_VotingPowerVariations_OrderDirection) {
    QueryInput_VotingPowerVariations_OrderDirection["Asc"] = "asc";
    QueryInput_VotingPowerVariations_OrderDirection["Desc"] = "desc";
})(QueryInput_VotingPowerVariations_OrderDirection || (exports.QueryInput_VotingPowerVariations_OrderDirection = QueryInput_VotingPowerVariations_OrderDirection = {}));
var QueryInput_VotingPowers_OrderBy;
(function (QueryInput_VotingPowers_OrderBy) {
    QueryInput_VotingPowers_OrderBy["DelegationsCount"] = "delegationsCount";
    QueryInput_VotingPowers_OrderBy["SignedVariation"] = "signedVariation";
    QueryInput_VotingPowers_OrderBy["Variation"] = "variation";
    QueryInput_VotingPowers_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotingPowers_OrderBy || (exports.QueryInput_VotingPowers_OrderBy = QueryInput_VotingPowers_OrderBy = {}));
var QueryInput_VotingPowers_OrderDirection;
(function (QueryInput_VotingPowers_OrderDirection) {
    QueryInput_VotingPowers_OrderDirection["Asc"] = "asc";
    QueryInput_VotingPowers_OrderDirection["Desc"] = "desc";
})(QueryInput_VotingPowers_OrderDirection || (exports.QueryInput_VotingPowers_OrderDirection = QueryInput_VotingPowers_OrderDirection = {}));
var Query_FeedEvents_Items_Items_Relevance;
(function (Query_FeedEvents_Items_Items_Relevance) {
    Query_FeedEvents_Items_Items_Relevance["High"] = "HIGH";
    Query_FeedEvents_Items_Items_Relevance["Low"] = "LOW";
    Query_FeedEvents_Items_Items_Relevance["Medium"] = "MEDIUM";
})(Query_FeedEvents_Items_Items_Relevance || (exports.Query_FeedEvents_Items_Items_Relevance = Query_FeedEvents_Items_Items_Relevance = {}));
var Query_FeedEvents_Items_Items_Type;
(function (Query_FeedEvents_Items_Items_Type) {
    Query_FeedEvents_Items_Items_Type["Delegation"] = "DELEGATION";
    Query_FeedEvents_Items_Items_Type["Proposal"] = "PROPOSAL";
    Query_FeedEvents_Items_Items_Type["ProposalExtended"] = "PROPOSAL_EXTENDED";
    Query_FeedEvents_Items_Items_Type["Transfer"] = "TRANSFER";
    Query_FeedEvents_Items_Items_Type["Vote"] = "VOTE";
})(Query_FeedEvents_Items_Items_Type || (exports.Query_FeedEvents_Items_Items_Type = Query_FeedEvents_Items_Items_Type = {}));
var Timestamp_Const;
(function (Timestamp_Const) {
    Timestamp_Const["Timestamp"] = "timestamp";
})(Timestamp_Const || (exports.Timestamp_Const = Timestamp_Const = {}));
exports.GetDaOsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetDAOs" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "daos" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingDelay" } }, { "kind": "Field", "name": { "kind": "Name", "value": "chainId" } }] } }] } }] } }] };
exports.ListOffchainProposalsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListOffchainProposals" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "NonNegativeInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "PositiveInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_offchainProposals_orderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "JSON" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "offchainProposals" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "status" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "discussion" } }, { "kind": "Field", "name": { "kind": "Name", "value": "link" } }, { "kind": "Field", "name": { "kind": "Name", "value": "state" } }, { "kind": "Field", "name": { "kind": "Name", "value": "created" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ProposalNonVotersDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ProposalNonVoters" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "JSON" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposalNonVoters" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "addresses" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "addresses" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voter" } }] } }] } }] } }] };
exports.GetProposalByIdDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetProposalById" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposal" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "id" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "id" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endTimestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "txHash" } }] } }] } }] };
exports.ListProposalsDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListProposals" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "NonNegativeInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "PositiveInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_proposals_orderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "JSON" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromEndDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "includeOptimisticProposals" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_proposals_includeOptimisticProposals" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "proposals" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "status" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "status" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromEndDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromEndDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "includeOptimisticProposals" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "includeOptimisticProposals" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposerAccountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "title" } }, { "kind": "Field", "name": { "kind": "Name", "value": "description" } }, { "kind": "Field", "name": { "kind": "Name", "value": "startBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endBlock" } }, { "kind": "Field", "name": { "kind": "Name", "value": "endTimestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "status" } }, { "kind": "Field", "name": { "kind": "Name", "value": "forVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "againstVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "abstainVotes" } }, { "kind": "Field", "name": { "kind": "Name", "value": "txHash" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.GetEventRelevanceThresholdDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "GetEventRelevanceThreshold" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "relevance" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_getEventRelevanceThreshold_relevance" } } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "type" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_getEventRelevanceThreshold_type" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "getEventRelevanceThreshold" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "relevance" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "relevance" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "type" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "type" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "threshold" } }] } }] } }] };
exports.ListVotesDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListVotes" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddressIn" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "JSON" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "NonNegativeInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votes_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votes_orderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "support" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "votes" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "voterAddressIn" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddressIn" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "toDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "support" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "support" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "transactionHash" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "voterAddress" } }, { "kind": "Field", "name": { "kind": "Name", "value": "support" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "reason" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalTitle" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ListOffchainVotesDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListOffchainVotes" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Float" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "NonNegativeInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votesOffchain_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_votesOffchain_orderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddresses" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "JSON" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "votesOffchain" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "toDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "toDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "voterAddresses" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "voterAddresses" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voter" } }, { "kind": "Field", "name": { "kind": "Name", "value": "created" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proposalTitle" } }, { "kind": "Field", "name": { "kind": "Name", "value": "reason" } }, { "kind": "Field", "name": { "kind": "Name", "value": "vp" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
exports.ListHistoricalVotingPowerDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "ListHistoricalVotingPower" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "PositiveInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "NonNegativeInt" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_historicalVotingPower_orderBy" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "queryInput_historicalVotingPower_orderDirection" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }, { "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "address" } }, "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "String" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "historicalVotingPower" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "limit" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "limit" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "skip" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "skip" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderBy" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderBy" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "orderDirection" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "orderDirection" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "fromDate" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "fromDate" } } }, { "kind": "Argument", "name": { "kind": "Name", "value": "address" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "address" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "items" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "accountId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "timestamp" } }, { "kind": "Field", "name": { "kind": "Name", "value": "votingPower" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delta" } }, { "kind": "Field", "name": { "kind": "Name", "value": "daoId" } }, { "kind": "Field", "name": { "kind": "Name", "value": "transactionHash" } }, { "kind": "Field", "name": { "kind": "Name", "value": "logIndex" } }, { "kind": "Field", "name": { "kind": "Name", "value": "delegation" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "from" } }, { "kind": "Field", "name": { "kind": "Name", "value": "to" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }, { "kind": "Field", "name": { "kind": "Name", "value": "previousDelegate" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "transfer" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "from" } }, { "kind": "Field", "name": { "kind": "Name", "value": "to" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }] } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "totalCount" } }] } }] } }] };
