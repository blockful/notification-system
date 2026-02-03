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
    delta: string | null;
    timestamp: string;
    votingPower: string | null;
    transfer: {
        amount: string | null;
        fromAccountId: string;
        toAccountId: string;
    } | null;
    daoId: string | null;
    transactionHash: string;
    accountId: string;
}, {
    delta: string | null;
    timestamp: string;
    votingPower: string | null;
    transactionHash: string;
    accountId: string;
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
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            transactionHash: string;
            accountId: string;
        }, {
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transactionHash: string;
            accountId: string;
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
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            transactionHash: string;
            accountId: string;
        }[];
    }, {
        items: {
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transactionHash: string;
            accountId: string;
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
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            transactionHash: string;
            accountId: string;
        }[];
    } | null;
}, {
    votingPowerHistorys: {
        items: {
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transactionHash: string;
            accountId: string;
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
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transfer: {
                amount: string | null;
                fromAccountId: string;
                toAccountId: string;
            } | null;
            daoId: string | null;
            transactionHash: string;
            accountId: string;
        }[];
    };
}, {
    votingPowerHistorys: {
        items: {
            delta: string | null;
            timestamp: string;
            votingPower: string | null;
            transactionHash: string;
            accountId: string;
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
