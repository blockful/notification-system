import { createLogger, type Logger } from '@anticapture/observability';

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

    /**
     * Counter for consecutive failures
     * @protected
     */
    protected consecutiveFailures = 0;

    /**
     * Maximum consecutive failures before stopping the trigger
     * @private
     */
    private readonly maxConsecutiveFailures = 5;

    protected readonly logger: Logger;

    constructor(id: string, interval: number, logger: Logger = createLogger('logic-system')) {
        this.id = id;
        this.interval = interval;
        this.logger = logger.child({ component: id });
    }

    /**
     * Process data with built-in filtering and perform trigger actions
     * @param data Raw data from the database
     * @param options Optional filter options
     * @returns Result of the processing
     */
    abstract process(data: TData[], options?: TFilterOptions): Promise<void>;

    /**
     * Fetches data for processing
     * @protected
     * @returns Array of data objects
     */
    protected abstract fetchData(options: TFilterOptions): Promise<TData[]>;

    /**
     * Starts the trigger to run at the specified interval
     * @param options Options for filtering data
     * @throws {Error} If maximum consecutive failures are reached
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
                if (this.consecutiveFailures > 0) this.resetConsecutiveFailures();
            } catch (error) {
                await this.handleError(error);
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

    /**
     * Handles errors from the trigger.
     * If the error is not recoverable, the trigger will stop.
     * If the error is recoverable, the trigger will retry on the next interval.
     * @param error Error object
     */
    private async handleError(error: unknown): Promise<void> {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.logger.error(
                { err: error, consecutiveFailures: this.consecutiveFailures, event: 'trigger.stopped_after_failures' },
                'trigger stopped after consecutive failures',
            );
            await this.stop();
            return;
        }
        this.logger.warn(
            {
                err: error,
                consecutiveFailures: this.consecutiveFailures,
                maxConsecutiveFailures: this.maxConsecutiveFailures,
                event: 'trigger.will_retry',
            },
            'trigger will retry on next interval',
        );
    }

    /**
     * Resets the consecutive failures counter.
     */
    private resetConsecutiveFailures(): void {
        this.consecutiveFailures = 0;
    }
} 