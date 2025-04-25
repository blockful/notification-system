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
    const timer = setInterval(async () => { //TODO vai pra dentro do trigger // Cada um vai ter sua propria query pro banco
        try {
            const proposals = await proposalRepository.listAll();
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
