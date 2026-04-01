"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRelevance = exports.FeedEventType = exports.QueryInput_VotesOffchain_OrderBy = exports.QueryInput_Votes_OrderBy = exports.QueryInput_HistoricalVotingPower_OrderBy = exports.OrderDirection = void 0;
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["Asc"] = "asc";
    OrderDirection["Desc"] = "desc";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
var QueryInput_HistoricalVotingPower_OrderBy;
(function (QueryInput_HistoricalVotingPower_OrderBy) {
    QueryInput_HistoricalVotingPower_OrderBy["Delta"] = "delta";
    QueryInput_HistoricalVotingPower_OrderBy["Timestamp"] = "timestamp";
})(QueryInput_HistoricalVotingPower_OrderBy || (exports.QueryInput_HistoricalVotingPower_OrderBy = QueryInput_HistoricalVotingPower_OrderBy = {}));
var QueryInput_Votes_OrderBy;
(function (QueryInput_Votes_OrderBy) {
    QueryInput_Votes_OrderBy["Timestamp"] = "timestamp";
    QueryInput_Votes_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_Votes_OrderBy || (exports.QueryInput_Votes_OrderBy = QueryInput_Votes_OrderBy = {}));
var QueryInput_VotesOffchain_OrderBy;
(function (QueryInput_VotesOffchain_OrderBy) {
    QueryInput_VotesOffchain_OrderBy["Timestamp"] = "timestamp";
    QueryInput_VotesOffchain_OrderBy["VotingPower"] = "votingPower";
})(QueryInput_VotesOffchain_OrderBy || (exports.QueryInput_VotesOffchain_OrderBy = QueryInput_VotesOffchain_OrderBy = {}));
var FeedEventType;
(function (FeedEventType) {
    FeedEventType["Delegation"] = "DELEGATION";
    FeedEventType["Proposal"] = "PROPOSAL";
    FeedEventType["ProposalExtended"] = "PROPOSAL_EXTENDED";
    FeedEventType["Transfer"] = "TRANSFER";
    FeedEventType["Vote"] = "VOTE";
})(FeedEventType || (exports.FeedEventType = FeedEventType = {}));
var FeedRelevance;
(function (FeedRelevance) {
    FeedRelevance["High"] = "HIGH";
    FeedRelevance["Low"] = "LOW";
    FeedRelevance["Medium"] = "MEDIUM";
})(FeedRelevance || (exports.FeedRelevance = FeedRelevance = {}));
