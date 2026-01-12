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
declare const VotingPowerHistoryItemSchema: z.ZodObject<{
    accountId: z.ZodString;
    timestamp: z.ZodString;
    votingPower: z.ZodNullable<z.ZodString>;
    delta: z.ZodNullable<z.ZodString>;
    daoId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    transactionHash: z.ZodString;
    delegation: z.ZodDefault<z.ZodNullable<z.ZodObject<{
        delegatorAccountId: z.ZodString;
        delegateAccountId: z.ZodString;
        delegatedValue: z.ZodString;
        previousDelegate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        delegatorAccountId: string;
        delegateAccountId: string;
        delegatedValue: string;
        previousDelegate: string | null;
    }, {
        delegatorAccountId: string;
        delegateAccountId: string;
        delegatedValue: string;
        previousDelegate: string | null;
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
        delegateAccountId: string;
        delegatedValue: string;
        previousDelegate: string | null;
    } | null;
    timestamp: string;
    votingPower: string | null;
    delta: string | null;
    transfer: {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    } | null;
    daoId: string | null;
    accountId: string;
    transactionHash: string;
}, {
    timestamp: string;
    votingPower: string | null;
    delta: string | null;
    accountId: string;
    transactionHash: string;
    delegation?: {
        delegatorAccountId: string;
        delegateAccountId: string;
        delegatedValue: string;
        previousDelegate: string | null;
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
                delegateAccountId: z.ZodString;
                delegatedValue: z.ZodString;
                previousDelegate: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
            }, {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
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
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
            } | null;
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            transactionHash: string;
        }, {
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            accountId: string;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
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
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
            } | null;
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            transactionHash: string;
        }[];
    }, {
        items: {
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            accountId: string;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
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
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
            } | null;
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            transactionHash: string;
        }[];
    } | null;
}, {
    votingPowerHistorys: {
        items: {
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            accountId: string;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
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
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
            } | null;
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            accountId: string;
            transactionHash: string;
        }[];
    };
}, {
    votingPowerHistorys: {
        items: {
            timestamp: string;
            votingPower: string | null;
            delta: string | null;
            accountId: string;
            transactionHash: string;
            delegation?: {
                delegatorAccountId: string;
                delegateAccountId: string;
                delegatedValue: string;
                previousDelegate: string | null;
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
            txHash: z.ZodString;
            proposalId: z.ZodString;
            voterAccountId: z.ZodString;
            support: z.ZodString;
            votingPower: z.ZodString;
            timestamp: z.ZodString;
            reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            proposal: z.ZodNullable<z.ZodOptional<z.ZodObject<{
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                description: string;
            }, {
                description: string;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }, {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }>, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    }, {
        items: {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    }>;
}, "strip", z.ZodTypeAny, {
    votesOnchains: {
        items: {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    };
}, {
    votesOnchains: {
        items: {
            timestamp: string;
            votingPower: string;
            daoId: string;
            txHash: string;
            proposalId: string;
            voterAccountId: string;
            support: string;
            proposal?: {
                description: string;
            } | null | undefined;
            reason?: string | null | undefined;
        }[];
        totalCount: number;
    };
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
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: ({
            voter: string;
        } | null)[];
        totalCount: number;
    }, {
        items: ({
            voter: string;
        } | null)[];
        totalCount: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount: number;
    } | null;
}, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount: number;
    } | null;
}>, {
    proposalNonVoters: {
        items: {
            voter: string;
        }[];
        totalCount: number;
    };
}, {
    proposalNonVoters: {
        items: ({
            voter: string;
        } | null)[];
        totalCount: number;
    } | null;
}>;
type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
type SafeVotingPowerHistoryResponse = z.infer<typeof SafeVotingPowerHistoryResponseSchema>;
export type ProcessedVotingPowerHistory = z.infer<typeof VotingPowerHistoryItemSchema> & {
    changeType: 'delegation' | 'transfer' | 'other';
    sourceAccountId: string;
    targetAccountId: string;
    previousDelegate: string | null;
    newDelegate: string | null;
    chainId?: number;
};
export declare function processProposals(validated: SafeProposalsResponse, daoId: string): any;
export declare function processVotingPowerHistory(validated: SafeVotingPowerHistoryResponse, daoId: string, chainId?: number): ProcessedVotingPowerHistory[];
export {};
