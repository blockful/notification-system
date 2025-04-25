/**
 * Base abstract class for all triggers in the system
 */
export abstract class Trigger<TData, TFilterOptions = void> {
    /**
     * Unique identifier for this trigger
     */
    readonly id: string;

    /**
     * Interval in milliseconds between trigger executions
     */
    readonly interval: number;

    constructor(id: string, interval: number) {
        this.id = id;
        this.interval = interval;
    }

    /**
     * Process data with built-in filtering and perform trigger actions
     * @param data Raw data from the database
     * @param options Optional filter options
     * @returns Result of the processing
     */
    abstract process(data: TData[], options?: TFilterOptions): Promise<string>;
} 