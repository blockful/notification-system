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

  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }
}

