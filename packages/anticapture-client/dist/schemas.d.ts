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
declare const VotingPowerHistoryItemSchema: z.ZodEffects<z.ZodObject<{
    accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    votingPower: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    delta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    daoId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    transactionHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    delegation: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        delegatorAccountId: z.ZodNullable<z.ZodString>;
        delegatedValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        delegatorAccountId: string | null;
        delegatedValue: string;
    }, {
        delegatorAccountId: string | null;
        delegatedValue: string;
    }>>>;
    transfer: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        amount: z.ZodNullable<z.ZodString>;
        fromAccountId: z.ZodNullable<z.ZodString>;
        toAccountId: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    }, {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    }>>>;
}, "strip", z.ZodTypeAny, {
    delegation?: {
        delegatorAccountId: string | null;
        delegatedValue: string;
    } | null | undefined;
    transfer?: {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    } | null | undefined;
    daoId?: string | null | undefined;
    timestamp?: string | null | undefined;
    accountId?: string | null | undefined;
    votingPower?: string | null | undefined;
    delta?: string | null | undefined;
    transactionHash?: string | null | undefined;
}, {
    delegation?: {
        delegatorAccountId: string | null;
        delegatedValue: string;
    } | null | undefined;
    transfer?: {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    } | null | undefined;
    daoId?: string | null | undefined;
    timestamp?: string | null | undefined;
    accountId?: string | null | undefined;
    votingPower?: string | null | undefined;
    delta?: string | null | undefined;
    transactionHash?: string | null | undefined;
}>, {
    accountId: string | null;
    timestamp: string;
    votingPower: string;
    delta: string;
    daoId: string;
    transactionHash: string;
    delegation: {
        delegatorAccountId: string | null;
        delegatedValue: string;
    } | null;
    transfer: {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    } | null;
} | null, {
    delegation?: {
        delegatorAccountId: string | null;
        delegatedValue: string;
    } | null | undefined;
    transfer?: {
        amount: string | null;
        fromAccountId: string | null;
        toAccountId: string | null;
    } | null | undefined;
    daoId?: string | null | undefined;
    timestamp?: string | null | undefined;
    accountId?: string | null | undefined;
    votingPower?: string | null | undefined;
    delta?: string | null | undefined;
    transactionHash?: string | null | undefined;
}>;
export declare const SafeVotingPowerHistoryResponseSchema: z.ZodCatch<z.ZodEffects<z.ZodObject<{
    votingPowerHistorys: z.ZodNullable<z.ZodObject<{
        items: z.ZodArray<z.ZodEffects<z.ZodObject<{
            accountId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            timestamp: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            votingPower: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            delta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            daoId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            transactionHash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            delegation: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                delegatorAccountId: z.ZodNullable<z.ZodString>;
                delegatedValue: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                delegatorAccountId: string | null;
                delegatedValue: string;
            }, {
                delegatorAccountId: string | null;
                delegatedValue: string;
            }>>>;
            transfer: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                amount: z.ZodNullable<z.ZodString>;
                fromAccountId: z.ZodNullable<z.ZodString>;
                toAccountId: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            }, {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }, {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }>, {
            accountId: string | null;
            timestamp: string;
            votingPower: string;
            delta: string;
            daoId: string;
            transactionHash: string;
            delegation: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null;
            transfer: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null;
        } | null, {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: ({
            accountId: string | null;
            timestamp: string;
            votingPower: string;
            delta: string;
            daoId: string;
            transactionHash: string;
            delegation: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null;
            transfer: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null;
        } | null)[];
    }, {
        items: {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    votingPowerHistorys: {
        items: ({
            accountId: string | null;
            timestamp: string;
            votingPower: string;
            delta: string;
            daoId: string;
            transactionHash: string;
            delegation: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null;
            transfer: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null;
        } | null)[];
    } | null;
}, {
    votingPowerHistorys: {
        items: {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }[];
    } | null;
}>, {
    votingPowerHistorys: {
        items: {
            accountId: string | null;
            timestamp: string;
            votingPower: string;
            delta: string;
            daoId: string;
            transactionHash: string;
            delegation: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null;
            transfer: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null;
        }[];
    };
}, {
    votingPowerHistorys: {
        items: {
            delegation?: {
                delegatorAccountId: string | null;
                delegatedValue: string;
            } | null | undefined;
            transfer?: {
                amount: string | null;
                fromAccountId: string | null;
                toAccountId: string | null;
            } | null | undefined;
            daoId?: string | null | undefined;
            timestamp?: string | null | undefined;
            accountId?: string | null | undefined;
            votingPower?: string | null | undefined;
            delta?: string | null | undefined;
            transactionHash?: string | null | undefined;
        }[];
    } | null;
}>>;
export type SafeDaosResponse = z.infer<typeof SafeDaosResponseSchema>;
export type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
export type SafeProposalByIdResponse = z.infer<typeof SafeProposalByIdResponseSchema>;
export type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string | null;
    targetAccountId: string | null;
};
export declare function processProposals(validated: SafeProposalsResponse, daoId: string): any;
export declare function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string): ProcessedVotingPowerHistory[];
export {};
