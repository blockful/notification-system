import { jest } from '@jest/globals';

/**
 * Creates a minimal mock HTTP client for testing
 * Used to mock axios instances in integration tests
 */
export const createMockHttpClient = () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
} as any);

/**
 * Mock proposal data structure for GraphQL responses
 */
export const createMockProposal = (daoId: string, status: string) => ({
  id: "test-proposal-1",
  daoId,
  status,
  description: "# Test Proposal\\n\\nThis is a test proposal for integration testing.",
  abstainVotes: "0",
  againstVotes: "0", 
  forVotes: "1000000000000000000000",
  calldatas: ["0x"],
  endBlock: "16575874",
  proposerAccountId: "0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5",
  startBlock: "16530056",
  signatures: [""],
  targets: ["0x2686A8919Df194aA7673244549E68D42C1685d03"],
  timestamp: "1675207295",
  values: ["1000000000000000000"]
});

/**
 * Creates GraphQL response for ListProposals query
 */
export const createListProposalsResponse = (daoId: string, status: string) => ({
  data: {
    data: {
      proposalsOnchains: {
        items: status === 'ACTIVE' ? [createMockProposal(daoId, status)] : []
      }
    }
  }
});

/**
 * Creates GraphQL response for GetDAOs query
 */
export const createGetDAOsResponse = (daoId: string) => ({
  data: {
    data: {
      daos: {
        items: [{ id: daoId }]
      }
    }
  }
});

/**
 * Sets up GraphQL mock implementation for HTTP client
 */
export const setupGraphQLMock = (
  mockHttpClient: any, 
  testDaoId: string, 
  mockProposalStatus: string
) => {
  (mockHttpClient.post as jest.Mock).mockImplementation((url: any, body: any) => {
    if (!body.query) {
      return Promise.resolve({ data: { success: true } });
    }

    if (body.query.includes('ListProposals')) {
      const hasActiveFilter = body.variables?.where?.status === 'active';
      const effectiveStatus = hasActiveFilter ? mockProposalStatus : 'PENDING';
      return Promise.resolve(createListProposalsResponse(testDaoId, effectiveStatus));
    }
    
    if (body.query.includes('GetDAOs')) {
      return Promise.resolve(createGetDAOsResponse(testDaoId));
    }
    
    // Default response for unknown queries
    return Promise.resolve({ data: { data: {} } });
  });
}; 