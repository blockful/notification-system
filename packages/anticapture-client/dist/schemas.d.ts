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
declare const HistoricalVotingPowerItemSchema: z.ZodObject<{
    accountId: z.ZodString;
    timestamp: z.ZodString;
    votingPower: z.ZodString;
    delta: z.ZodString;
    daoId: z.ZodString;
    transactionHash: z.ZodString;
    delegation: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
        previousDelegate: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
        value: string;
        previousDelegate: string | null;
    }, {
        from: string;
        to: string;
        value: string;
        previousDelegate: string | null;
    }>>;
    transfer: z.ZodNullable<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
        value: string;
    }, {
        from: string;
        to: string;
        value: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    delegation: {
        from: string;
        to: string;
        value: string;
        previousDelegate: string | null;
    } | null;
    delta: string;
    timestamp: string;
    votingPower: string;
    transfer: {
        from: string;
        to: string;
        value: string;
    } | null;
    daoId: string;
    accountId: string;
    transactionHash: string;
}, {
    delegation: {
        from: string;
        to: string;
        value: string;
        previousDelegate: string | null;
    } | null;
    delta: string;
    timestamp: string;
    votingPower: string;
    transfer: {
        from: string;
        to: string;
        value: string;
    } | null;
    daoId: string;
    accountId: string;
    transactionHash: string;
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
            delegation: z.ZodNullable<z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                value: z.ZodString;
                previousDelegate: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            }, {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            }>>;
            transfer: z.ZodNullable<z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                value: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                from: string;
                to: string;
                value: string;
            }, {
                from: string;
                to: string;
                value: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        }, {
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        }>>, "many">;
        totalCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        items: ({
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        } | null)[];
        totalCount: number;
    }, {
        items: ({
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        } | null)[];
        totalCount: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    historicalVotingPower: {
        items: ({
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        } | null)[];
        totalCount: number;
    } | null;
}, {
    historicalVotingPower: {
        items: ({
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        } | null)[];
        totalCount: number;
    } | null;
}>, {
    historicalVotingPower: {
        items: {
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        }[];
        totalCount: number;
    };
}, {
    historicalVotingPower: {
        items: ({
            delegation: {
                from: string;
                to: string;
                value: string;
                previousDelegate: string | null;
            } | null;
            delta: string;
            timestamp: string;
            votingPower: string;
            transfer: {
                from: string;
                to: string;
                value: string;
            } | null;
            daoId: string;
            accountId: string;
            transactionHash: string;
        } | null)[];
        totalCount: number;
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
export {};
