/**
 * Shared test data and helper functions
 */

import { jest } from '@jest/globals';
import { zeroAddress } from 'viem';
import { ProposalDataSource, ProposalOnChain } from '../src/interfaces/proposal.interface';
import { DispatcherService } from '../src/interfaces/dispatcher.interface';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

// Common test values
export const DEFAULT_INTERVAL = 5000;
export const FINISHED_STATUSES = ['EXECUTED', 'DEFEATED', 'SUCCEEDED', 'EXPIRED', 'CANCELED'] as const;

/**
 * Creates a proposal with default values and custom overrides
 */
export const createProposal = (overrides: Partial<ProposalOnChain> = {}): ProposalOnChain => ({
  id: '1',
  daoId: 'dao1',
  proposerAccountId: 'user1',
  targets: ['0x123'],
  values: ['0'],
  signatures: ['vote()'],
  calldatas: ['0x0'],
  startBlock: 1000,
  endBlock: 1100,
  endTimestamp: '1625097600',
  description: 'Test proposal',
  timestamp: '1625097600',
  status: 'ACTIVE',
  forVotes: '1000000000000000000000',
  againstVotes: '500000000000000000000',
  abstainVotes: '100000000000000000000',
  ...overrides
});

/**
 * Creates a finished proposal with specific status
 */
export const createFinishedProposal = (
  status: typeof FINISHED_STATUSES[number],
  overrides: Partial<ProposalOnChain> = {}
): ProposalOnChain => createProposal({ status, ...overrides });

/**
 * Creates a proposal with null/undefined fields for edge case testing
 */
export const createProposalWithMissingFields = (): ProposalOnChain => createProposal({
  description: null,
  timestamp: null,
  endTimestamp: null,
  status: null,
  forVotes: undefined,
  againstVotes: undefined,
  abstainVotes: undefined
});

/**
 * Creates voting power history entry
 */
export const createVotingPowerHistory = (
  overrides: Partial<ProcessedVotingPowerHistory> = {}
): ProcessedVotingPowerHistory => ({
  accountId: 'user1.eth',
  timestamp: '1625097600',
  delta: '100',
  daoId: 'ENS',
  transactionHash: '0x123abc',
  delegation: {
    from: 'delegator1.eth',
    to: 'user1.eth',
    value: '100',
    previousDelegate: zeroAddress
  },
  transfer: null,
  changeType: 'delegation',
  sourceAccountId: 'delegator1.eth',
  targetAccountId: 'user1.eth',
  previousDelegate: zeroAddress,
  newDelegate: 'user1.eth',
  votingPower: '1000',
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

// Sample voting power data for tests
export const mockVotingPowerData = [
  createVotingPowerHistory(),
  createVotingPowerHistory({
    accountId: 'user2.eth',
    timestamp: '1625184000',
    delta: '-50',
    transactionHash: '0x456def',
    delegation: {
      from: 'delegator2.eth',
      to: zeroAddress,
      value: '50',
      previousDelegate: 'user2.eth'
    },
    sourceAccountId: 'delegator2.eth',
    targetAccountId: 'user2.eth',
    previousDelegate: 'user2.eth',
    newDelegate: zeroAddress,
    votingPower: '500'
  })
];

