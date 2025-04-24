import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { cronJob, initializeLogicSystem } from '..';
import { Proposal_Repository, Proposal_On_Chain, List_Proposals_Options } from '../new-proposal-trigger/src/interfaces/proposal_repository';
import { Queue_Repository, Message, Publish_Result } from '../new-proposal-trigger/src/interfaces/queue_repository';

jest.useFakeTimers();

describe('Logic System', () => {
    describe('cronJob', () => {
        it('should call triggers at specified intervals', async () => {
            const mockCallback = jest.fn().mockImplementation(async () => {}) as jest.MockedFunction<() => Promise<void>>;
            const interval = 1000; // 1 sec

            const job = cronJob(mockCallback, interval);
            
            // Verify that the function wasn't called immediately
            expect(mockCallback).not.toBeCalled();
                
            // Advance time by 1 second and run pending timers
            jest.advanceTimersByTime(interval);
            await Promise.resolve(); // Let the async callback complete
            expect(mockCallback).toBeCalledTimes(1);

            // Advance time by another second
            jest.advanceTimersByTime(interval);
            await Promise.resolve(); // Let the async callback complete
            expect(mockCallback).toBeCalledTimes(2);

            // Stop the job and verify no more calls
            job.stop();
            jest.advanceTimersByTime(interval);
            await Promise.resolve(); // Let any pending callbacks complete
            expect(mockCallback).toBeCalledTimes(2);
        });
    });

    describe('initializeLogicSystem', () => {
        let mockProposalRepository: Proposal_Repository;
        let mockQueueRepository: Queue_Repository;

        beforeEach(() => {
            const getById = jest.fn().mockImplementation(async () => null) as jest.MockedFunction<(id: string) => Promise<Proposal_On_Chain | null>>;
            const listAll = jest.fn().mockImplementation(async () => []) as jest.MockedFunction<(options?: List_Proposals_Options) => Promise<Proposal_On_Chain[]>>;
            const publishMessage = jest.fn().mockImplementation(async () => ({ success: true })) as jest.MockedFunction<(message: Message) => Promise<Publish_Result>>;

            mockProposalRepository = {
                get_by_id: getById,
                list_all: listAll
            };

            mockQueueRepository = {
                publish_message: publishMessage
            };

            jest.clearAllMocks();
        });

        it('should check for new proposals at specified intervals', async () => {
            const system = initializeLogicSystem({
                proposalRepository: mockProposalRepository,
                queueRepository: mockQueueRepository,
                interval: 1000, // 1 second for testing
                status: 'active'
            });

            // Verify that list_all wasn't called immediately
            expect(mockProposalRepository.list_all).not.toBeCalled();
            
            // Advance time and verify the call
            jest.advanceTimersByTime(1000);
            await Promise.resolve(); // Let the async callback complete
            expect(mockProposalRepository.list_all).toBeCalledTimes(1);

            // Stop the system and verify no more calls
            system.stop();
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
            expect(mockProposalRepository.list_all).toBeCalledTimes(1);
        });

        it('should use default interval when not specified', async () => {
            const system = initializeLogicSystem({
                proposalRepository: mockProposalRepository,
                queueRepository: mockQueueRepository,
                status: 'active'
            });

            // Default interval is 60000ms (1 minute)
            jest.advanceTimersByTime(60000);
            await Promise.resolve();
            expect(mockProposalRepository.list_all).toBeCalledTimes(1);

            system.stop();
        });
    });
});
    
    