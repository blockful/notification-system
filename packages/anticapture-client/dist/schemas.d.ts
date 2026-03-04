import { z } from 'zod';
export { QueryInput_GetEventRelevanceThreshold_Type as FeedEventType, QueryInput_GetEventRelevanceThreshold_Relevance as FeedRelevance, } from './gql/graphql';
export declare const SafeDaosResponseSchema: z.ZodEffects<z.ZodObject<{
    daos: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            votingDelay: z.ZodOptional<z.ZodString>;
            chainId: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }, {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    }, {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    daos: {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    } | null;
}, {
    daos: {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    } | null;
}>, {
    daos: {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    };
}, {
    daos: {
        items: {
            id: string;
            chainId: number;
            votingDelay?: string | undefined;
        }[];
    } | null;
}>;
export declare const SafeProposalsResponseSchema: z.ZodEffects<z.ZodObject<{
    proposals: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodAny, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: any[];
        totalCount: number;
    }, {
        items: any[];
        totalCount: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    proposals: {
        items: any[];
        totalCount: number;
    } | null;
}, {
    proposals: {
        items: any[];
        totalCount: number;
    } | null;
}>, {
    proposals: {
        items: any[];
        totalCount: number;
    };
}, {
    proposals: {
        items: any[];
        totalCount: number;
    } | null;
}>;
export declare const SafeProposalByIdResponseSchema: z.ZodObject<{
    proposal: z.ZodNullable<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    proposal?: any;
}, {
    proposal?: any;
}>;
declare const HistoricalVotingPowerItemSchema: z.ZodObject<{
    accountId: z.ZodString;
    timestamp: z.ZodString;
    votingPower: z.ZodString;
    delta: z.ZodString;
    daoId: z.ZodString;
    transactionHash: z.ZodString;
    logIndex: z.ZodNumber;
    delegation: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
        previousDelegate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    }, {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    }>>;
    transfer: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        from: string;
        to: string;
    }, {
        value: string;
        from: string;
        to: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    delta: string;
    votingPower: string;
    daoId: string;
    transactionHash: string;
    accountId: string;
    logIndex: number;
    delegation: {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    } | null;
    transfer: {
        value: string;
        from: string;
        to: string;
    } | null;
}, {
    timestamp: string;
    delta: string;
    votingPower: string;
    daoId: string;
    transactionHash: string;
    accountId: string;
    logIndex: number;
    delegation: {
        value: string;
        from: string;
        to: string;
        previousDelegate: string | null;
    } | null;
    transfer: {
        value: string;
        from: string;
        to: string;
    } | null;
}>;
export declare const SafeHistoricalVotingPowerResponseSchema: z.ZodEffects<z.ZodObject<{
    historicalVotingPower: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodNullable<z.ZodObject<{
            accountId: z.ZodString;
            timestamp: z.ZodString;
            votingPower: z.ZodString;
            delta: z.ZodString;
            daoId: z.ZodString;
            transactionHash: z.ZodString;
            logIndex: z.ZodNumber;
            delegation: z.ZodNullable<z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                value: z.ZodString;
                previousDelegate: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            }, {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            }>>;
            transfer: z.ZodNullable<z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                value: string;
                from: string;
                to: string;
            }, {
                value: string;
                from: string;
                to: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        }, {
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        }>>, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: ({
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        } | null)[];
        totalCount: number;
    }, {
        items: ({
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        } | null)[];
        totalCount: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    historicalVotingPower: {
        items: ({
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        } | null)[];
        totalCount: number;
    } | null;
}, {
    historicalVotingPower: {
        items: ({
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        } | null)[];
        totalCount: number;
    } | null;
}>, {
    historicalVotingPower: {
        items: {
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        }[];
        totalCount: number;
    };
}, {
    historicalVotingPower: {
        items: ({
            timestamp: string;
            delta: string;
            votingPower: string;
            daoId: string;
            transactionHash: string;
            accountId: string;
            logIndex: number;
            delegation: {
                value: string;
                from: string;
                to: string;
                previousDelegate: string | null;
            } | null;
            transfer: {
                value: string;
                from: string;
                to: string;
            } | null;
        } | null)[];
        totalCount: number;
    } | null;
}>;
export declare const SafeVotesResponseSchema: z.ZodEffects<z.ZodObject<{
    votes: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodNullable<z.ZodObject<{
            transactionHash: z.ZodString;
            proposalId: z.ZodString;
            voterAddress: z.ZodString;
            support: z.ZodNumber;
            votingPower: z.ZodString;
            timestamp: z.ZodNumber;
            reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            proposalTitle: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        }, {
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        }>>, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: ({
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        } | null)[];
        totalCount: number;
    }, {
        items: ({
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        } | null)[];
        totalCount: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    votes: {
        items: ({
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        } | null)[];
        totalCount: number;
    } | null;
}, {
    votes: {
        items: ({
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        } | null)[];
        totalCount: number;
    } | null;
}>, {
    votes: {
        items: {
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    };
}, {
    votes: {
        items: ({
            timestamp: number;
            votingPower: string;
            support: number;
            transactionHash: string;
            proposalId: string;
            voterAddress: string;
            proposalTitle: string;
            reason?: string | null | undefined;
        } | null)[];
        totalCount: number;
    } | null;
}>;
export declare const SafeProposalNonVotersResponseSchema: z.ZodEffects<z.ZodObject<{
    proposalNonVoters: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodNullable<z.ZodObject<{
            voter: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            voter: string;
        }, {
            voter: string;
        }>>, "many">;
        totalCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        items: ({
            voter: string;
        } | null)[];
        totalCount?: number | undefined;
    }, {
        items: ({
            voter: string;
        } | null)[];
        totalCount?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount?: number | undefined;
    } | null;
}, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount?: number | undefined;
    } | null;
}>, {
    proposalNonVoters: {
        items: {
            voter: string;
        }[];
        totalCount?: number | undefined;
    };
}, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount?: number | undefined;
    } | null;
}>;
export declare const EventThresholdResponseSchema: z.ZodObject<{
    getEventRelevanceThreshold: z.ZodObject<{
        threshold: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        threshold: string;
    }, {
        threshold: string;
    }>;
}, "strip", z.ZodTypeAny, {
    getEventRelevanceThreshold: {
        threshold: string;
    };
}, {
    getEventRelevanceThreshold: {
        threshold: string;
    };
}>;
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeHistoricalVotingPowerResponse = z.infer<typeof SafeHistoricalVotingPowerResponseSchema>;
export type ProcessedVotingPowerHistory = z.infer<typeof HistoricalVotingPowerItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
    previousDelegate: string | null;
    newDelegate: string | null;
    chainId?: number;
};
export declare function processProposals(validated: SafeProposalsResponse, daoId: string): any;
export declare function processVotingPowerHistory(validated: SafeHistoricalVotingPowerResponse, daoId: string, chainId?: number): ProcessedVotingPowerHistory[];
