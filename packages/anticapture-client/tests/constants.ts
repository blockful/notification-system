export const TEST_FIXTURES = {
  daos: {
    uniswap: { id: 'uni', votingDelay: '1000', chainId: 1, quorum: '0', proposalThreshold: '0', votingPeriod: '0', timelockDelay: '0', alreadySupportCalldataReview: false, supportOffchainData: false },
    ens: { id: 'ens', votingDelay: '500', chainId: 1, quorum: '0', proposalThreshold: '0', votingPeriod: '0', timelockDelay: '0', alreadySupportCalldataReview: false, supportOffchainData: false },
    compound: { id: 'comp', votingDelay: '0', chainId: 1, quorum: '0', proposalThreshold: '0', votingPeriod: '0', timelockDelay: '0', alreadySupportCalldataReview: false, supportOffchainData: false }
  },
  proposals: {
    basic: [
      { id: '1', daoId: 'uni', txHash: '0x1', proposerAccountId: '0x1111111111111111111111111111111111111111', title: 'Proposal 1', description: 'Test proposal 1', startBlock: 1, endBlock: 2, timestamp: 1, status: 'ACTIVE', forVotes: '0', againstVotes: '0', abstainVotes: '0', startTimestamp: 1, endTimestamp: 2, quorum: '0', calldatas: [], values: [], targets: [], proposalType: null },
      { id: '2', daoId: 'uni', txHash: '0x2', proposerAccountId: '0x1111111111111111111111111111111111111111', title: 'Proposal 2', description: 'Test proposal 2', startBlock: 1, endBlock: 2, timestamp: 2, status: 'ACTIVE', forVotes: '0', againstVotes: '0', abstainVotes: '0', startTimestamp: 1, endTimestamp: 2, quorum: '0', calldatas: [], values: [], targets: [], proposalType: null }
    ]
  },
  votingPower: {
    sample: { 
      timestamp: '100', 
      daoId: 'ens',
      transactionHash: '0xtx',
      votingPower: '1000', 
      delta: '10',
      accountId: 'acc1',
      logIndex: 0,
      delegation: null,
      transfer: null
    }
  }
};
