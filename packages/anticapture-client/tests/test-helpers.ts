import { jest } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import axios from 'axios';

export function createMockClient() {
  const mockAxios = axios.create();
  const client = new AnticaptureClient(mockAxios);
  const mockQuery = jest.fn<() => Promise<any>>();
  (client as any).query = mockQuery;
  return { client, mockQuery };
}

export function createProposalResponse(id: string, description: string, title?: string) {
  return {
    proposals: [{ id, description, title: title || null }]
  };
}

export function createVotingPowerResponse(timestamp: string, accountId: string) {
  return {
    votingPowerHistorys: {
      items: [{
        timestamp,
        address: `0x${accountId.replace('acc', '')}`,
        votingPower: '1000',
        accountId
      }]
    }
  };
}