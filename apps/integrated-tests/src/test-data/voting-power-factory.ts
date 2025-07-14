import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

export class VotingPowerFactory {
  static createVotingPowerEvent(overrides?: Partial<ProcessedVotingPowerHistory>): ProcessedVotingPowerHistory {
    const baseTimestamp = Date.now().toString();
    
    return {
      accountId: 'user1.eth',
      timestamp: baseTimestamp,
      delta: '100',
      daoId: 'test-dao',
      transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
      delegation: {
        delegatorAccountId: 'delegator.eth',
        delegatedValue: '100'
      },
      transfer: null,
      changeType: 'delegation',
      sourceAccountId: 'delegator.eth',
      targetAccountId: 'user1.eth',
      votingPower: '1000',
      ...overrides
    };
  }

  static createMultipleVotingPowerEvents(
    count: number,
    baseAccountId: string = 'user',
    daoId: string = 'test-dao'
  ): ProcessedVotingPowerHistory[] {
    return Array.from({ length: count }, (_, index) => {
      const timestamp = (Date.now() + index * 1000).toString(); // 1 second apart
      return this.createVotingPowerEvent({
        accountId: `${baseAccountId}${index + 1}.eth`,
        timestamp,
        daoId,
        transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        delta: (100 + index * 50).toString(),
        votingPower: (1000 + index * 100).toString()
      });
    });
  }

  static createVotingPowerEventsForMultipleDaos(
    daoIds: string[], 
    accountId: string = 'user1.eth'
  ): ProcessedVotingPowerHistory[] {
    return daoIds.map((daoId, index) => {
      const timestamp = (Date.now() + index * 1000).toString();
      return this.createVotingPowerEvent({
        accountId,
        daoId,
        timestamp,
        transactionHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        delta: (100 + index * 25).toString()
      });
    });
  }

  static createDelegationEvent(
    delegatorAccountId: string,
    targetAccountId: string,
    delegatedValue: string,
    daoId: string = 'test-dao',
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
    daoId: string = 'test-dao',
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