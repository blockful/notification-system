import { jest } from '@jest/globals';
import { ProposalData } from '../test-data/proposal-factory';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

export class GraphQLMockSetup {
  /**
   * Transforms ProcessedVotingPowerHistory to raw GraphQL format
   */
  private static transformToRawGraphQLFormat(votingPowerData: ProcessedVotingPowerHistory[]): any[] {
    return votingPowerData.map(vp => ({
      accountId: vp.accountId,
      timestamp: vp.timestamp,
      votingPower: vp.votingPower,
      delta: vp.delta || null,
      daoId: vp.daoId,
      transactionHash: vp.transactionHash,
      delegation: vp.delegation ? {
        delegatorAccountId: vp.delegation.delegatorAccountId,
        delegatedValue: vp.delegation.delegatedValue
      } : null,
      transfer: vp.transfer ? {
        amount: vp.transfer.amount,
        fromAccountId: vp.transfer.fromAccountId,
        toAccountId: vp.transfer.toAccountId
      } : null
    }));
  }

  /**
   * Creates standard empty GraphQL response structure
   */
  private static createEmptyGraphQLResponse(): any {
    return {
      data: {
        data: {
          votingPowerHistorys: { items: [] },
          proposalsOnchains: { items: [] },
          daos: { items: [] }
        }
      }
    };
  }
  static setupProposalMock(mockHttpClient: any, proposals: ProposalData[]): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatusIn = data.variables?.where?.status_in;
        const requestedTimestampGt = data.variables?.where?.timestamp_gt;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        let proposalsToReturn = proposals;
        
        // Filter by status
        if (requestedStatusIn && Array.isArray(requestedStatusIn)) {
          proposalsToReturn = proposalsToReturn.filter(p => requestedStatusIn.includes(p.status));
        }
        
        // Filter by timestamp for incremental processing
        if (requestedTimestampGt) {
          proposalsToReturn = proposalsToReturn.filter(p => {
            const proposalTimestamp = new Date(p.timestamp).getTime() / 1000;
            return proposalTimestamp > parseInt(requestedTimestampGt);
          });
        }
        
        // Filter by daoId from header
        if (requestedDaoId) {
          proposalsToReturn = proposalsToReturn.filter(p => p.daoId === requestedDaoId);
        }
        
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
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
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupEmptyMock(mockHttpClient: any): void {
    mockHttpClient.post.mockImplementation(() => {
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupVotingPowerMock(mockHttpClient: any, votingPowerData: ProcessedVotingPowerHistory[]): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListVotingPowerHistorys')) {
        const requestedTimestampGt = data.variables?.where?.timestamp_gt;
        let votingPowerToReturn = votingPowerData;
        
        // Filter by timestamp if provided
        if (requestedTimestampGt) {
          votingPowerToReturn = votingPowerToReturn.filter(vp => 
            parseInt(vp.timestamp) > parseInt(requestedTimestampGt)
          );
        }
        
        // Convert ProcessedVotingPowerHistory back to raw GraphQL format
        const rawVotingPowerData = this.transformToRawGraphQLFormat(votingPowerToReturn);
        
        return Promise.resolve({
          data: {
            data: {
              votingPowerHistorys: {
                items: rawVotingPowerData
              }
            }
          }
        });
      }
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupCombinedMock(
    mockHttpClient: any, 
    proposals: ProposalData[], 
    votingPowerData: ProcessedVotingPowerHistory[]
  ): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      // Handle proposal queries
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatusIn = data.variables?.where?.status_in;
        const requestedTimestampGt = data.variables?.where?.timestamp_gt;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        let proposalsToReturn = proposals;
        
        if (requestedStatusIn && Array.isArray(requestedStatusIn)) {
          proposalsToReturn = proposalsToReturn.filter(p => requestedStatusIn.includes(p.status));
        }
        
        // Filter by timestamp for incremental processing
        if (requestedTimestampGt) {
          proposalsToReturn = proposalsToReturn.filter(p => {
            const proposalTimestamp = new Date(p.timestamp).getTime() / 1000;
            return proposalTimestamp > parseInt(requestedTimestampGt);
          });
        }
        
        if (requestedDaoId) {
          proposalsToReturn = proposalsToReturn.filter(p => p.daoId === requestedDaoId);
        }
        
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: proposalsToReturn
              }
            }
          }
        });
      }

      // Handle voting power queries
      if (data.query && data.query.includes('ListVotingPowerHistorys')) {
        const requestedTimestampGt = data.variables?.where?.timestamp_gt;
        let votingPowerToReturn = votingPowerData;
        
        if (requestedTimestampGt) {
          votingPowerToReturn = votingPowerToReturn.filter(vp => 
            parseInt(vp.timestamp) > parseInt(requestedTimestampGt)
          );
        }
        
        // Convert ProcessedVotingPowerHistory back to raw GraphQL format
        const rawVotingPowerData = this.transformToRawGraphQLFormat(votingPowerToReturn);
        
        return Promise.resolve({
          data: {
            data: {
              votingPowerHistorys: {
                items: rawVotingPowerData
              }
            }
          }
        });
      }

      // Handle DAO queries
      if (data.query && data.query.includes('GetDAOs')) {
        const uniqueDaoIds = [...new Set([
          ...proposals.map(p => p.daoId),
          ...votingPowerData.map(vp => vp.daoId)
        ])];
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
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
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