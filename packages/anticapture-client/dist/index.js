"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryInput_Votes_OrderDirection = exports.QueryInput_Votes_OrderBy = exports.QueryInput_HistoricalVotingPower_OrderDirection = exports.QueryInput_HistoricalVotingPower_OrderBy = exports.QueryInput_Proposals_OrderDirection = exports.AnticaptureClient = void 0;
var anticapture_client_1 = require("./anticapture-client");
Object.defineProperty(exports, "AnticaptureClient", { enumerable: true, get: function () { return anticapture_client_1.AnticaptureClient; } });
// Export GraphQL enums
var graphql_1 = require("./gql/graphql");
Object.defineProperty(exports, "QueryInput_Proposals_OrderDirection", { enumerable: true, get: function () { return graphql_1.QueryInput_Proposals_OrderDirection; } });
Object.defineProperty(exports, "QueryInput_HistoricalVotingPower_OrderBy", { enumerable: true, get: function () { return graphql_1.QueryInput_HistoricalVotingPower_OrderBy; } });
Object.defineProperty(exports, "QueryInput_HistoricalVotingPower_OrderDirection", { enumerable: true, get: function () { return graphql_1.QueryInput_HistoricalVotingPower_OrderDirection; } });
Object.defineProperty(exports, "QueryInput_Votes_OrderBy", { enumerable: true, get: function () { return graphql_1.QueryInput_Votes_OrderBy; } });
Object.defineProperty(exports, "QueryInput_Votes_OrderDirection", { enumerable: true, get: function () { return graphql_1.QueryInput_Votes_OrderDirection; } });
