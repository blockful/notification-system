"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryInput_VotesOffchain_OrderBy = exports.QueryInput_Votes_OrderBy = exports.QueryInput_HistoricalVotingPower_OrderBy = exports.QueryInput_Proposals_Status_Items = exports.OrderDirection = exports.FeedRelevance = exports.FeedEventType = exports.AnticaptureClient = void 0;
var anticapture_client_1 = require("./anticapture-client");
Object.defineProperty(exports, "AnticaptureClient", { enumerable: true, get: function () { return anticapture_client_1.AnticaptureClient; } });
var schemas_1 = require("./schemas");
Object.defineProperty(exports, "FeedEventType", { enumerable: true, get: function () { return schemas_1.FeedEventType; } });
Object.defineProperty(exports, "FeedRelevance", { enumerable: true, get: function () { return schemas_1.FeedRelevance; } });
// Enums previously generated from GraphQL — preserved as-is so no caller changes.
var OrderDirection;
(function (OrderDirection) {
    OrderDirection["Asc"] = "asc";
    OrderDirection["Desc"] = "desc";
})(OrderDirection || (exports.OrderDirection = OrderDirection = {}));
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
})(QueryInput_Proposals_Status_Items || (exports.QueryInput_Proposals_Status_Items = QueryInput_Proposals_Status_Items = {}));
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
