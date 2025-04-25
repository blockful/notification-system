import { NewProposalTrigger } from './triggers/new-proposal-trigger';
import { ProposalDB, ProposalStatus } from './interfaces/repositories/proposal.interface';
import { ApiService } from './interfaces/repositories/api-service.interface';

/**
 * Initializes the logic system with a new proposal trigger
 * @param config Configuration object containing services and options
 * @returns Object with methods to control the trigger
 */
export function initializeLogicSystem(config: {
    proposalDB: ProposalDB;
    apiService: ApiService;
    interval?: number;
    status: ProposalStatus;
}) {
    const { 
        proposalDB, 
        apiService, 
        interval = 60000,
        status
    } = config;

    // Create the new proposal trigger with its own interval management
    const trigger = new NewProposalTrigger(
        apiService,
        proposalDB,
        interval
    );

    // Start the trigger with the specified status
    trigger.start({ status });

    return {
        /**
         * Stops the trigger and cleans up resources
         */
        stop: () => {
            trigger.stop();
        }
    };
}
