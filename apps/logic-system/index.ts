import { NewProposalTrigger } from './new-proposal-trigger/src/new_proposal_trigger';
import { Proposal_Repository, ProposalStatus } from './new-proposal-trigger/src/interfaces/proposal_repository';
import { Queue_Repository } from './new-proposal-trigger/src/interfaces/queue_repository';

/**
 * Creates a cron job that executes a callback at specified intervals
 * @param callback Async function to be executed
 * @param interval Interval in milliseconds between executions
 * @returns Object with a stop function to clear the interval
 */
export function cronJob(callback: () => Promise<void>, interval: number) {
    const timer = setInterval(async () => {
        await callback();
    }, interval);
    
    return {
        stop: () => clearInterval(timer)
    };
}

/**
 * Initializes the logic system with a new proposal trigger
 * @param config Configuration object containing repositories and options
 * @returns Object with methods to control the trigger
 */
export function initializeLogicSystem(config: {
    proposalRepository: Proposal_Repository;
    queueRepository: Queue_Repository;
    interval?: number;
    status: ProposalStatus;
}) {
    const { 
        proposalRepository, 
        queueRepository, 
        interval = 60000,
        status
    } = config;

    // Create the new proposal trigger
    const trigger = new NewProposalTrigger(
        queueRepository,
        interval
    );

    // Start the cron job
    const job = cronJob(async () => {
        const proposals = await proposalRepository.list_all();
        const filteredProposals = await trigger.filter(proposals, { status });
        await trigger.process(filteredProposals);
    }, trigger.interval);

    return {
        /**
         * Stops the trigger and cleans up resources
         */
        stop: () => {
            job.stop();
        }
    };
}

// Export trigger-related types for external use
export type { Trigger } from './core/interfaces/trigger';
