import { jest } from '@jest/globals';
import { ProposalData } from '../test-data/proposal-factory';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

export class GraphQLMockSetup {
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

  private static filterProposals(
    proposals: ProposalData[],
    variables: any,
    headers: any,
    enableTimestampFilter: boolean = true
  ): ProposalData[] {
    let filtered = proposals;
    
    // Special case: if asking for pending proposals, return empty array
    // This mimics the behavior of ProposalFinishedGraphQLMockHelper
    if (variables?.where?.status === 'pending') {
      return [];
    }
    
    if (variables?.where?.status_in && Array.isArray(variables.where.status_in)) {
      filtered = filtered.filter(p => variables.where.status_in.includes(p.status));
    }
    
    // Only filter by timestamp if enabled (proposal-finished tests need this disabled)
    if (enableTimestampFilter && variables?.where?.timestamp_gt) {
      filtered = filtered.filter(p => {
        const proposalTimestamp = new Date(p.timestamp).getTime() / 1000;
        return proposalTimestamp > parseInt(variables.where.timestamp_gt);
      });
    }
    
    if (headers?.['anticapture-dao-id']) {
      filtered = filtered.filter(p => p.daoId === headers['anticapture-dao-id']);
    }
    
    return filtered;
  }

  private static handleProposalQuery(
    proposals: ProposalData[],
    variables: any,
    headers: any,
    enableTimestampFilter: boolean = true
  ): any {
    const filteredProposals = this.filterProposals(proposals, variables, headers, enableTimestampFilter);
    return {
      data: {
        data: {
          proposalsOnchains: {
            items: filteredProposals
          }
        }
      }
    };
  }

  private static handleVotingPowerQuery(
    votingPowerData: ProcessedVotingPowerHistory[],
    variables: any
  ): any {
    let filtered = votingPowerData;
    
    if (variables?.where?.timestamp_gt) {
      filtered = filtered.filter(vp => 
        parseInt(vp.timestamp) > parseInt(variables.where.timestamp_gt)
      );
    }
    
    return {
      data: {
        data: {
          votingPowerHistorys: {
            items: this.transformToRawGraphQLFormat(filtered)
          }
        }
      }
    };
  }

  private static handleDAOQuery(
    proposals: ProposalData[],
    votingPowerData: ProcessedVotingPowerHistory[] = [],
    blockTime: number = 12,
    fallbackDaoId?: string
  ): any {
    const uniqueDaoIds = [...new Set([
      ...proposals.map(p => p.daoId),
      ...votingPowerData.map(vp => vp.daoId)
    ])];
    
    // Use fallback DAO if no proposals and fallback is provided
    const daoIds = uniqueDaoIds.length > 0 ? uniqueDaoIds : 
                   fallbackDaoId ? [fallbackDaoId] : [];
    
    return {
      data: {
        data: {
          daos: {
            items: daoIds.map(daoId => ({ id: daoId, blockTime }))
          }
        }
      }
    };
  }

  static setupProposalMock(mockHttpClient: any, proposals: ProposalData[], blockTime: number = 12, testDaoId?: string, enableTimestampFilter: boolean = true): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query?.includes('ListProposals')) {
        return Promise.resolve(this.handleProposalQuery(proposals, data.variables, config?.headers, enableTimestampFilter));
      }
      
      if (data.query?.includes('GetDAOs')) {
        return Promise.resolve(this.handleDAOQuery(proposals, [], blockTime, testDaoId));
      }
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupVotingPowerMock(mockHttpClient: any, votingPowerData: ProcessedVotingPowerHistory[]): void {
    mockHttpClient.post.mockImplementation((url: string, data: any) => {
      if (data.query?.includes('ListVotingPowerHistorys')) {
        return Promise.resolve(this.handleVotingPowerQuery(votingPowerData, data.variables));
      }
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupCombinedMock(
    mockHttpClient: any, 
    proposals: ProposalData[], 
    votingPowerData: ProcessedVotingPowerHistory[],
    blockTime: number = 12,
    testDaoId?: string
  ): void {
    mockHttpClient.post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query?.includes('ListProposals')) {
        return Promise.resolve(this.handleProposalQuery(proposals, data.variables, config?.headers));
      }

      if (data.query?.includes('ListVotingPowerHistorys')) {
        return Promise.resolve(this.handleVotingPowerQuery(votingPowerData, data.variables));
      }

      if (data.query?.includes('GetDAOs')) {
        return Promise.resolve(this.handleDAOQuery(proposals, votingPowerData, blockTime, testDaoId));
      }
      
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static setupEmptyMock(mockHttpClient: any): void {
    mockHttpClient.post.mockImplementation(() => {
      return Promise.resolve(this.createEmptyGraphQLResponse());
    });
  }

  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }

}