/**
 * Base interface for all triggers in the system
 */
export interface Trigger<TData, TFilterOptions = void> {
    /**
     * Unique identifier for this trigger
     */
    readonly id: string;

    /**
     * Interval in milliseconds between trigger executions
     */
    readonly interval: number;

    /**
     * Filter data from the database before processing
     * @param data Raw data from the database
     * @param options Optional filter options
     * @returns Filtered data ready for processing
     */
    filter(data: TData[], options?: TFilterOptions): Promise<TData[]>;

    /**
     * Process the filtered data and perform trigger actions
     * @param filteredData Data that has been filtered and is ready for processing
     * @returns Result of the processing
     */
    process(filteredData: TData[]): Promise<string>;
} 