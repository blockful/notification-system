import { z } from 'zod';
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
        items: z.ZodNullable<z.ZodArray<z.ZodAny, "many">>;
    }, "strip", z.ZodTypeAny, {
        items: any[] | null;
    }, {
        items: any[] | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    proposals: {
        items: any[] | null;
    } | null;
}, {
    proposals: {
        items: any[] | null;
    } | null;
}>, {
    proposals: {
        items: any[] | null;
    };
}, {
    proposals: {
        items: any[] | null;
    } | null;
}>;
export declare const SafeProposalByIdResponseSchema: z.ZodObject<{
    proposal: z.ZodNullable<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    proposal?: any;
}, {
    proposal?: any;
}>;
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
export declare const SafeVotingPowerHistoryResponseSchema: z.ZodEffects<z.ZodObject<{
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
}>;
export declare const SafeVotesOnchainsResponseSchema: z.ZodObject<{
    votesOnchains: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            daoId: z.ZodString;
            txHash: z.ZodOptional<z.ZodString>;
            proposalId: z.ZodString;
            voterAccountId: z.ZodString;
            support: z.ZodOptional<z.ZodString>;
            votingPower: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodString>;
            reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }, {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }>, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    }, {
        items: {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    votesOnchains: {
        items: {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    };
}, {
    votesOnchains: {
        items: {
            daoId: string;
            proposalId: string;
            voterAccountId: string;
            timestamp?: string | undefined;
            votingPower?: string | undefined;
            txHash?: string | undefined;
            support?: string | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    };
}>;
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
    chainId?: number;
};
export declare function processProposals(validated: SafeProposalsResponse['proposals']['items'], daoId: string): any;
export declare function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string, chainId?: number): ProcessedVotingPowerHistory[];
export {};
