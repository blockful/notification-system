import { ProposalData } from '../fixtures';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

/**
 * @notice Setup class for GraphQL API mocking in integration tests
 * @dev Provides methods to mock different GraphQL endpoints with test data
 */
export class GraphQLMockSetup {
  /**
   * @notice Transforms ProcessedVotingPowerHistory to raw GraphQL format
   * @dev Converts typed objects back to the raw format expected by GraphQL responses
   * @param votingPowerData Array of processed voting power history objects
   * @return Array of objects in raw GraphQL response format
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
   * @notice Creates standard empty GraphQL response structure
   * @dev Returns the base response format with empty data arrays
   * @return Empty GraphQL response object with proper structure
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
  /**
   * @notice Sets up mock for proposal-related GraphQL queries
   * @param mockHttpClient The mocked HTTP client instance
   * @param proposals Array of proposal data to return in responses
   */
  static setupProposalMock(mockHttpClient: any, proposals: ProposalData[]): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatusIn = data.variables?.where?.status_in;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        let proposalsToReturn = proposals;
        
        // Filter by status (exact match - system supports only specific variations)
        if (requestedStatusIn && Array.isArray(requestedStatusIn)) {
          proposalsToReturn = proposalsToReturn.filter(p => 
            requestedStatusIn.includes(p.status)
          );
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

  /**
   * @notice Sets up mock to return empty responses for all GraphQL queries
   * @param mockHttpClient The mocked HTTP client instance
   */
  static setupEmptyMock(mockHttpClient: any): void {
    mockHttpClient.post.mockImplementation(() => {
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  /**
   * @notice Sets up mock for voting power history GraphQL queries
   * @param mockHttpClient The mocked HTTP client instance
   * @param votingPowerData Array of voting power history data to return
   */
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

  /**
   * @notice Sets up mock for both proposal and voting power GraphQL queries
   * @param mockHttpClient The mocked HTTP client instance
   * @param proposals Array of proposal data to return
   * @param votingPowerData Array of voting power history data to return
   */
  static setupCombinedMock(
    mockHttpClient: any, 
    proposals: ProposalData[], 
    votingPowerData: ProcessedVotingPowerHistory[]
  ): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      // Handle proposal queries
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatusIn = data.variables?.where?.status_in;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        let proposalsToReturn = proposals;
        
        if (requestedStatusIn && Array.isArray(requestedStatusIn)) {
          proposalsToReturn = proposalsToReturn.filter(p => requestedStatusIn.includes(p.status));
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

  /**
   * @notice Resets the HTTP client mock to clean state
   * @param mockHttpClient The mocked HTTP client instance to reset
   */
  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }
}

