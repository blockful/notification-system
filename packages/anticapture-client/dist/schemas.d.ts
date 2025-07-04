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
export declare function validateDaosResponse(data: unknown): {
    daos: {
        items: {
            id: string;
        }[];
    };
};
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
export declare function validateProposalsResponse(data: unknown): {
    proposalsOnchains: {
        items: any[];
    };
};
export declare function validateProposalByIdResponse(data: unknown): {
    proposalsOnchain?: any;
};
export type SafeDaosResponse = z.infer<typeof SafeDaosResponseSchema>;
export type SafeProposalsResponse = z.infer<typeof SafeProposalsResponseSchema>;
export type SafeProposalByIdResponse = z.infer<typeof SafeProposalByIdResponseSchema>;
export declare function validateAndProcessProposals(data: unknown, daoId: string): any;
