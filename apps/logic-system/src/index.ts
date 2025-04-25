import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalRepository, ProposalStatus } from './interfaces/repositories/proposal-repository.interface';
import { ApiRepository } from './interfaces/repositories/api-repository.interface';

/**
 * Initializes the logic system with a new proposal trigger
 * @param config Configuration object containing repositories and options
 * @returns Object with methods to control the trigger
 */
export function initializeLogicSystem(config: {
    proposalRepository: ProposalRepository;
    apiRepository: ApiRepository;
    interval?: number;
    status: ProposalStatus;
}) {
    const { 
        proposalRepository, 
        apiRepository, 
        interval = 60000,
        status
    } = config;

    // Create the new proposal trigger
    const trigger = new NewProposalTrigger(
        apiRepository,
        interval
    );

    // Start the interval directly
    const timer = setInterval(async () => {
        const proposals = await proposalRepository.listAll();
        const filteredProposals = await trigger.filter(proposals, { status });
        await trigger.process(filteredProposals);
    }, trigger.interval);

    return {
        /**
         * Stops the trigger and cleans up resources
         */
        stop: () => {
            clearInterval(timer);
        }
    };
}

// Export trigger-related types for external use
export type { Trigger } from './interfaces/core/trigger.interface';

// Export interfaces
export * from './interfaces/repositories/proposal-repository.interface';
export * from './interfaces/repositories/queue-repository.interface';
export * from './interfaces/repositories/api-repository.interface';