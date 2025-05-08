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

    /**
     * Timer reference for the interval
     * @protected
     */
    protected timer: NodeJS.Timeout | null = null;

    /**
     * Current filter options
     * @protected
     */
    protected options?: TFilterOptions;

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

    /**
     * Fetches data for processing
     * @protected
     * @returns Array of data objects
     */
    protected abstract fetchData(options: TFilterOptions): Promise<TData[]>;

    /**
     * Starts the trigger to run at the specified interval
     * @param options Options for filtering data
     * @throws {Error} If there's an error during trigger execution
     */
    start(options: TFilterOptions): void {
        if (this.timer) {
            this.stop();
        }
        
        this.options = options;
        
        this.timer = setInterval(async () => {
            try {
                const data = await this.fetchData(options);
                await this.process(data, this.options);
            } catch (error) {
                await this.stop();
                throw new Error(`Error in trigger execution (${this.id}): ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }, this.interval);
    }

    /**
     * Stops the trigger and cleans up resources
     */
    async stop(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
} 