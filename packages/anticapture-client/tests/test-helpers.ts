import { jest } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import axios from 'axios';

export function createMockClient() {
  const mockAxios = axios.create();
  const client = new AnticaptureClient(mockAxios);
  const mockRequest = jest.fn<() => Promise<any>>();
  (client as any).request = mockRequest;
  return { client, mockRequest };
}

export function createProposalResponse(id: string, description: string, title?: string) {
  return {
    items: [{
      id,
      daoId: 'uni',
      txHash: '0xtx',
      proposerAccountId: '0x1111111111111111111111111111111111111111',
      title: title || '',
      description,
      startBlock: 1,
      endBlock: 2,
      timestamp: 1,
      status: 'ACTIVE',
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      startTimestamp: 1,
      endTimestamp: 2,
      quorum: '0',
      calldatas: [],
      values: [],
      targets: [],
      proposalType: null
    }],
    totalCount: 1
  };
}

export function createVotingPowerResponse(timestamp: string, accountId: string) {
  return {
    items: [{
      timestamp,
      daoId: 'ens',
      transactionHash: '0xtx',
      votingPower: '1000',
      delta: '10',
      accountId,
      logIndex: 0,
      delegation: null,
      transfer: null
    }],
    totalCount: 1
  };
}
