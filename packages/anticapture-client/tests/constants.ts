export const TEST_FIXTURES = {
  daos: {
    uniswap: { id: 'UNISWAP', votingDelay: '1000' },
    ens: { id: 'ENS', votingDelay: '500' },
    compound: { id: 'COMPOUND' }
  },
  proposals: {
    basic: [
      { id: '1', description: 'Test proposal 1' },
      { id: '2', description: 'Test proposal 2' }
    ]
  },
  votingPower: {
    sample: { 
      timestamp: '100', 
      address: '0x1', 
      votingPower: '1000', 
      accountId: 'acc1' 
    }
  }
};