/**
 * Shared test data used across tests
 */

import { jest } from '@jest/globals';
import { ProposalDataSource, ProposalOnChain, ProposalStatus } from '../src/interfaces/proposal.interface';
import { DispatcherService } from '../src/interfaces/dispatcher.interface';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

/**
 * Sample proposal data for testing
 */
export const mockProposal: ProposalOnChain = {
  id: '1',
  daoId: 'dao1',
  proposerAccountId: 'user1',
  targets: ['0x123'],
  values: ['0'],
  signatures: ['vote()'],
  calldatas: ['0x0'],
  description: 'Test proposal',
  timestamp: '2023-01-01T00:00:00Z',
  status: 'active' as ProposalStatus,
  forVotes: '100',
  againstVotes: '50',
  abstainVotes: '10'
};

/**
 * Sample voting power history data for testing
 */
export const mockVotingPowerData: ProcessedVotingPowerHistory[] = [
  {
    accountId: 'user1.eth',
    timestamp: '1625097600', // July 1, 2021
    delta: '100',
    daoId: 'ens',
    transactionHash: '0x123abc',
    delegation: {
      delegatorAccountId: 'delegator1.eth',
      delegatedValue: '100'
    },
    transfer: null,
    changeType: 'delegation',
    sourceAccountId: 'delegator1.eth',
    targetAccountId: 'user1.eth',
    votingPower: '1000'
  },
  {
    accountId: 'user2.eth', 
    timestamp: '1625184000', // July 2, 2021
    delta: '-50',
    daoId: 'ens',
    transactionHash: '0x456def',
    delegation: {
      delegatorAccountId: 'delegator2.eth',
      delegatedValue: '50'
    },
    transfer: null,
    changeType: 'delegation',
    sourceAccountId: 'delegator2.eth',
    targetAccountId: 'user2.eth',
    votingPower: '500'
  }
];

/**
 * Additional proposal variations for testing
 */
export const createMockProposal = (overrides: Partial<ProposalOnChain> = {}): ProposalOnChain => ({
  ...mockProposal,
  ...overrides
});

/**
 * Additional voting power data variations for testing
 */
export const createMockVotingPowerHistory = (overrides: Partial<ProcessedVotingPowerHistory> = {}): ProcessedVotingPowerHistory => ({
  ...mockVotingPowerData[0],
  ...overrides
});

/**
 * Creates a mocked DispatcherService
 */
export const createMockDispatcherService = (): jest.Mocked<DispatcherService> => ({
  sendMessage: jest.fn()
});

/**
 * Creates a mocked ProposalDataSource
 */
export const createMockProposalDataSource = (): jest.Mocked<ProposalDataSource> => ({
  getById: jest.fn(),
  listAll: jest.fn()
});

/**
 * Creates a mocked VotingPowerRepository
 */
export const createMockVotingPowerRepository = () => ({
  listVotingPowerHistory: jest.fn()
});

