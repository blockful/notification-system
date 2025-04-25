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

    // Create the new proposal trigger
    const trigger = new NewProposalTrigger(
        apiService,
        interval
    );

    // Start the interval directly
    const timer = setInterval(async () => { //TODO vai pra dentro do trigger // Cada um vai ter sua propria query pro banco
        try {
            const proposals = await proposalDB.listAll();
            // Agora process lida com a filtragem internamente
            await trigger.process(proposals, { status });
        } catch (error) {
            console.error('Error in trigger execution:', error);
        }
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
