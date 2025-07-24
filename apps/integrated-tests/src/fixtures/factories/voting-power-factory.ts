import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';
import { testConstants } from '../../config';

export class VotingPowerFactory {
  static createVotingPowerEvent(overrides?: Partial<ProcessedVotingPowerHistory>): ProcessedVotingPowerHistory {
    const baseTimestamp = Math.floor(Date.now() / 1000).toString();
    
    return {
      accountId: 'user1.eth',
      timestamp: baseTimestamp,
      delta: testConstants.votingPower.small,
      daoId: testConstants.daoIds.votingPowerTest,
      transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      delegation: {
        delegatorAccountId: 'delegator.eth',
        delegatedValue: testConstants.votingPower.small
      },
      transfer: null,
      changeType: 'delegation',
      sourceAccountId: 'delegator.eth',
      targetAccountId: 'user1.eth',
      votingPower: testConstants.votingPower.default,
      ...overrides
    };
  }

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

  static createDelegationEvent(
    delegatorAccountId: string,
    targetAccountId: string,
    delegatedValue: string,
    daoId: string = testConstants.daoIds.votingPowerTest,
    overrides?: Partial<ProcessedVotingPowerHistory>
  ): ProcessedVotingPowerHistory {
    return this.createVotingPowerEvent({
      accountId: targetAccountId,
      daoId,
      changeType: 'delegation',
      sourceAccountId: delegatorAccountId,
      targetAccountId,
      delegation: {
        delegatorAccountId,
        delegatedValue
      },
      transfer: null,
      delta: delegatedValue,
      ...overrides
    });
  }

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
      ...overrides
    });
  }
}