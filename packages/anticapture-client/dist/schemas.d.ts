import { z } from 'zod';
export declare const SafeDaosResponseSchema: z.ZodCatch<z.ZodEffects<z.ZodObject<{
    daos: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            id: string;
        }[];
    }, {
        items: {
            id: string;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    daos: {
        items: {
            id: string;
        }[];
    } | null;
}, {
    daos: {
        items: {
            id: string;
        }[];
    } | null;
}>, {
    daos: {
        items: {
            id: string;
        }[];
    };
}, {
    daos: {
        items: {
            id: string;
        }[];
    } | null;
}>>;
export declare const SafeProposalsResponseSchema: z.ZodCatch<z.ZodEffects<z.ZodObject<{
    proposalsOnchains: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        items: any[];
    }, {
        items: any[];
    }>>;
}, "strip", z.ZodTypeAny, {
    proposalsOnchains: {
        items: any[];
    } | null;
}, {
    proposalsOnchains: {
        items: any[];
    } | null;
}>, {
    proposalsOnchains: {
        items: any[];
    };
}, {
    proposalsOnchains: {
        items: any[];
    } | null;
}>>;
export declare const SafeProposalByIdResponseSchema: z.ZodCatch<z.ZodObject<{
    proposalsOnchain: z.ZodNullable<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    proposalsOnchain?: any;
}, {
    proposalsOnchain?: any;
}>>;
declare const VotingPowerHistoryItemSchema: z.ZodObject<{
    accountId: z.ZodString;
    timestamp: z.ZodString;
    votingPower: z.ZodNullable<z.ZodString>;
    delta: z.ZodNullable<z.ZodString>;
    daoId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    transactionHash: z.ZodString;
    delegation: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        delegatorAccountId: z.ZodString;
        delegatedValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        delegatorAccountId: string;
        delegatedValue: string;
    }, {
        delegatorAccountId: string;
        delegatedValue: string;
    }>>>;
    transfer: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        amount: z.ZodNullable<z.ZodString>;
        fromAccountId: z.ZodString;
        toAccountId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    }, {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    }>>>;
}, "strip", z.ZodTypeAny, {
    delegation: {
        delegatorAccountId: string;
        delegatedValue: string;
    } | null;
    timestamp: string;
    votingPower: string | null;
    transfer: {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    } | null;
    daoId: string | null;
    accountId: string;
    delta: string | null;
    transactionHash: string;
}, {
    timestamp: string;
    votingPower: string | null;
    accountId: string;
    delta: string | null;
    transactionHash: string;
    delegation?: {
        delegatorAccountId: string;
        delegatedValue: string;
    } | null | undefined;
    transfer?: {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    } | null | undefined;
    daoId?: string | null | undefined;
}>;
export declare const SafeVotingPowerHistoryResponseSchema: z.ZodCatch<z.ZodEffects<z.ZodObject<{
    votingPowerHistorys: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            accountId: z.ZodString;
            timestamp: z.ZodString;
            votingPower: z.ZodNullable<z.ZodString>;
            delta: z.ZodNullable<z.ZodString>;
            daoId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
            transactionHash: z.ZodString;
            delegation: z.ZodDefault<z.ZodNullable<z.ZodObject<{
                delegatorAccountId: z.ZodString;
                delegatedValue: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                delegatorAccountId: string;
                delegatedValue: string;
            }, {
                delegatorAccountId: string;
                delegatedValue: string;
            }>>>;
            transfer: z.ZodDefault<z.ZodNullable<z.ZodObject<{
                amount: z.ZodNullable<z.ZodString>;
                fromAccountId: z.ZodString;
                toAccountId: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            }, {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            delegation: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
        }, {
            timestamp: string;
            votingPower: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null | undefined;
            daoId?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            delegation: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
        }[];
    }, {
        items: {
            timestamp: string;
            votingPower: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null | undefined;
            daoId?: string | null | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    votingPowerHistorys: {
        items: {
            delegation: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
        }[];
    } | null;
}, {
    votingPowerHistorys: {
        items: {
            timestamp: string;
            votingPower: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null | undefined;
            daoId?: string | null | undefined;
        }[];
    } | null;
}>, {
    votingPowerHistorys: {
        items: {
            delegation: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
        }[];
    };
}, {
    votingPowerHistorys: {
        items: {
            timestamp: string;
            votingPower: string | null;
            accountId: string;
            delta: string | null;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null | undefined;
            daoId?: string | null | undefined;
        }[];
    } | null;
}>>;
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
};
export declare function processProposals(validated: SafeProposalsResponse, daoId: string): any;
export declare function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string): ProcessedVotingPowerHistory[];
export {};
