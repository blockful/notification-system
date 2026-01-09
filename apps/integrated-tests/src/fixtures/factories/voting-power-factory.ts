import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';
import { zeroAddress } from 'viem';
import { testConstants } from '../../config';

/**
 * @notice Factory class for creating test voting power history data
 * @dev Provides methods to generate realistic voting power events for testing
 */
export class VotingPowerFactory {
  /**
   * @notice Creates a single voting power event with default or custom data
   * @param overrides Optional partial data to override defaults
   * @return Complete ProcessedVotingPowerHistory object ready for testing
   */
  static createVotingPowerEvent(overrides?: Partial<ProcessedVotingPowerHistory>): ProcessedVotingPowerHistory {
    const baseTimestamp = Math.floor(Date.now() / 1000).toString();
    
    return {
      accountId: 'user1.eth',
      timestamp: baseTimestamp,
      delta: testConstants.votingPower.small,
      daoId: testConstants.daoIds.votingPowerTest,
      transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      chainId: 1, // Default to Ethereum mainnet for tests
      delegation: {
        delegatorAccountId: 'delegator.eth',
        delegateAccountId: 'user1.eth',
        delegatedValue: testConstants.votingPower.small,
        previousDelegate: zeroAddress
      },
      transfer: null,
      changeType: 'delegation',
      sourceAccountId: 'delegator.eth',
      targetAccountId: 'user1.eth',
      previousDelegate: zeroAddress,
      newDelegate: 'user1.eth',
      votingPower: testConstants.votingPower.default,
      ...overrides
    };
  }

  /**
   * @notice Creates multiple voting power events with sequential timestamps
   * @param count Number of events to create
   * @param baseAccountId Base string for account IDs (will append numbers)
   * @param daoId DAO identifier for all events
   * @return Array of ProcessedVotingPowerHistory objects with unique data
   */
  static createMultipleVotingPowerEvents(
    count: number,
    baseAccountId: string = 'user',
    daoId: string = testConstants.daoIds.votingPowerTest
  ): ProcessedVotingPowerHistory[] {
    return Array.from({ length: count }, (_, index) => {
      const timestamp = (Math.floor(Date.now() / 1000) + index).toString(); // 1 second apart
      return this.createVotingPowerEvent({
        accountId: `${baseAccountId}${index + 1}.eth`,
        timestamp,
        daoId,
        transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        delta: (parseInt(testConstants.votingPower.small) + index * 50).toString(),
        votingPower: (parseInt(testConstants.votingPower.default) + index * 100).toString()
      });
    });
  }

  /**
   * @notice Creates one voting power event for each specified DAO
   * @param daoIds Array of DAO IDs to create events for
   * @param accountId Account ID for all events
   * @return Array of ProcessedVotingPowerHistory objects, one per DAO
   */
  static createVotingPowerEventsForMultipleDaos(
    daoIds: string[], 
    accountId: string = 'user1.eth'
  ): ProcessedVotingPowerHistory[] {
    return daoIds.map((daoId, index) => {
      const timestamp = (Math.floor(Date.now() / 1000) + index).toString();
      return this.createVotingPowerEvent({
        accountId,
        daoId,
        timestamp,
        transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        delta: (parseInt(testConstants.votingPower.small) + index * 25).toString()
      });
    });
  }

  /**
   * @notice Creates a voting power delegation event
   * @param delegatorAccountId Account ID of the delegator
   * @param targetAccountId Account ID receiving the delegation
   * @param delegatedValue Amount of voting power being delegated
   * @param daoId DAO identifier for the delegation
   * @param overrides Optional partial data to override defaults
   * @return ProcessedVotingPowerHistory object representing delegation
   */
  static createDelegationEvent(
    delegatorAccountId: string,
    targetAccountId: string,
    delegatedValue: string,
    daoId: string = testConstants.daoIds.votingPowerTest,
    overrides?: Partial<ProcessedVotingPowerHistory>
  ): ProcessedVotingPowerHistory {
    const isUndelegation = delegatedValue.startsWith('-');
    
    return this.createVotingPowerEvent({
      accountId: targetAccountId,
      daoId,
      changeType: 'delegation',
      sourceAccountId: delegatorAccountId,
      targetAccountId,
      delegation: {
        delegatorAccountId,
        delegateAccountId: targetAccountId,
        delegatedValue,
        previousDelegate: isUndelegation ? targetAccountId : zeroAddress
      },
      transfer: null,
      delta: delegatedValue,
      // For new delegation: previousDelegate is 0x0, newDelegate is target
      // For undelegation: previousDelegate is target, newDelegate is 0x0
      previousDelegate: isUndelegation ? targetAccountId : zeroAddress,
      newDelegate: isUndelegation ? zeroAddress : targetAccountId,
      ...overrides
    });
  }

  /**
   * @notice Creates a voting power transfer event
   * @param fromAccountId Account ID sending the voting power
   * @param toAccountId Account ID receiving the voting power
   * @param transferValue Amount of voting power being transferred
   * @param daoId DAO identifier for the transfer
   * @param overrides Optional partial data to override defaults
   * @return ProcessedVotingPowerHistory object representing transfer
   */
  static createTransferEvent(
    fromAccountId: string,
    toAccountId: string,
    transferValue: string,
    daoId: string = testConstants.daoIds.votingPowerTest,
    overrides?: Partial<ProcessedVotingPowerHistory>
  ): ProcessedVotingPowerHistory {
    return this.createVotingPowerEvent({
      accountId: toAccountId,
      daoId,
      changeType: 'transfer',
      sourceAccountId: fromAccountId,
      targetAccountId: toAccountId,
      delegation: null,
      transfer: {
        fromAccountId,
        toAccountId,
        amount: transferValue
      },
      delta: transferValue,
      previousDelegate: null,
      newDelegate: null,
      ...overrides
    });
  }
}