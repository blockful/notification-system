import { jest } from '@jest/globals';
import { ProposalData } from '../test-data/proposal-factory';

export class GraphQLMockSetup {
  static setupProposalMock(mockHttpClient: any, proposals: ProposalData[]): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatusIn = data.variables?.where?.status_in;
        const daoIdHeader = config?.headers?.['anticapture-dao-id'];
        let proposalsToReturn = proposals;
        // Filter by DAO ID from header
        if (daoIdHeader) {
          proposalsToReturn = proposals.filter(p => p.daoId === daoIdHeader);
        }
        // Filter by status
        if (requestedStatusIn && Array.isArray(requestedStatusIn)) {
          proposalsToReturn = proposalsToReturn.filter(p => requestedStatusIn.includes(p.status));
        }
        // Remove daoId from response (since GraphQL query doesn't include it anymore)
        const proposalsWithoutDaoId = proposalsToReturn.map(({ daoId, ...proposal }) => proposal);
        
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsWithoutDaoId
              }
            }
          }
        });
      }
      
      if (data.query && data.query.includes('GetDAOs')) {
        // Extract unique DAOs from proposals
        const uniqueDaoIds = [...new Set(proposals.map(p => p.daoId))];
        return Promise.resolve({
          data: {
            data: {
              daos: {
                items: uniqueDaoIds.map(daoId => ({ id: daoId }))
              }
            }
          }
        });
      }
      
      return Promise.resolve({ data: { data: {} } });
    });
  }

  static setupEmptyMock(mockHttpClient: any): void {
    mockHttpClient.post.mockImplementation(() => {
      return Promise.resolve({ data: { data: {} } });
    });
  }

  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }
}

/**
 * Mock proposal data structure for GraphQL responses
 */
export const createMockProposal = (daoId: string, status: string) => ({
  id: "test-proposal-1",
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
        items: status?.toLowerCase() === 'pending' ? [createMockProposal(daoId, status)] : []
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
 * Sets up GraphQL mock implementation for HTTP client (Legacy - for complete-notification-flow.test.ts)
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
      const hasPendingFilter = body.variables?.where?.status?.toLowerCase() === 'pending';
      const effectiveStatus = hasPendingFilter ? mockProposalStatus : 'PENDING';
      return Promise.resolve(createListProposalsResponse(testDaoId, effectiveStatus));
    }
    
    if (body.query.includes('GetDAOs')) {
      return Promise.resolve(createGetDAOsResponse(testDaoId));
    }
    
    // Default response for unknown queries
    return Promise.resolve({ data: { data: {} } });
  });
};