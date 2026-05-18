import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { AnticaptureClient } from '../src/anticapture-client';

export const TEST_BASE_URL = 'http://test-api';

export function startServer() {
  return setupServer();
}

export function createTestClient() {
  return new AnticaptureClient({
    baseURL: TEST_BASE_URL,
    maxRetries: 0,
    timeoutMs: 5000,
    defaultHeaders: { 'x-client-source': 'notification-system-test' },
  });
}

export function daosResponse(items: Array<{
  id: string;
  votingDelay?: string;
  chainId?: number;
  supportOffchainData?: boolean;
  alreadySupportCalldataReview?: boolean;
}>) {
  return {
    items: items.map(d => ({
      id: d.id,
      votingDelay: d.votingDelay ?? '0',
      chainId: d.chainId ?? 1,
      supportOffchainData: d.supportOffchainData ?? false,
      alreadySupportCalldataReview: d.alreadySupportCalldataReview ?? false,
    })),
  };
}

export function createProposalResponse(id: string, description: string, title?: string) {
  return {
    items: [{ id, description, title: title ?? null, timestamp: 100 }],
    totalCount: 1,
  };
}

export function createVotingPowerResponse(timestamp: string, accountId: string) {
  return {
    items: [{
      timestamp,
      address: `0x${accountId.replace('acc', '')}`,
      votingPower: '1000',
      accountId,
    }],
    totalCount: 1,
  };
}
