import { ProposalData } from '../fixtures';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';

/**
 * @notice Setup class for GraphQL API mocking in integration tests
 * @dev Provides methods to mock different GraphQL endpoints with test data
 */
export class GraphQLMockSetup {
  /**
   * @notice Transforms ProcessedVotingPowerHistory to raw GraphQL format
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
   * @notice Generic mock implementation that handles all query types
   */
  private static createMockImplementation(proposals: ProposalData[] = [], votingPowerData: ProcessedVotingPowerHistory[] = [], daoChainMapping: Record<string, number> = {}, votesData: any[] = []) {
    return (url: string, data: any, config: any) => {
      // Handle proposals
      if (data.query?.includes('ListProposals')) {
        console.log('[Mock] ListProposals called with variables:', JSON.stringify(data.variables));
        console.log('[Mock] Headers:', JSON.stringify(config?.headers));
        let filtered = proposals;
        if (data.variables?.status) {
          // Status can be string or array (JSON type in GraphQL)
          const statusFilter = Array.isArray(data.variables.status) 
            ? data.variables.status 
            : [data.variables.status];
          filtered = filtered.filter(p => statusFilter.includes(p.status));
        }
        if (data.variables?.fromDate) {
          filtered = filtered.filter(p => parseInt(p.endTimestamp) >= data.variables.fromDate);
        }
        if (config?.headers?.['anticapture-dao-id']) {
          filtered = filtered.filter(p => p.daoId === config.headers['anticapture-dao-id']);
        }
        return Promise.resolve({
          data: { data: { proposals: { items: filtered } } }
        });
      }

      // Handle single proposal
      if (data.query?.includes('GetProposalById')) {
        const proposalId = data.variables?.id;
        const proposal = proposals.find(p => p.id === proposalId);
        return Promise.resolve({
          data: { data: { proposal: proposal || null } }
        });
      }

      // Handle voting power
      if (data.query?.includes('ListVotingPowerHistorys')) {
        let filtered = votingPowerData;
        if (data.variables?.where?.timestamp_gt) {
          filtered = filtered.filter(vp => parseInt(vp.timestamp) > parseInt(data.variables.where.timestamp_gt));
        }
        return Promise.resolve({
          data: { data: { votingPowerHistorys: { items: this.transformToRawGraphQLFormat(filtered) } } }
        });
      }

      // Handle votes
      if (data.query?.includes('ListVotesOnchains')) {
        let filtered = votesData;
        
        const daoId = data.variables?.daoId;
        const proposalIdIn = data.variables?.proposalId_in;
        const voterAccountIdIn = data.variables?.voterAccountId_in;
        
        // Filter by daoId if provided
        if (daoId) {
          filtered = filtered.filter((v: any) => v.daoId === daoId);
        }
        
        // Filter by proposalId_in if provided
        if (proposalIdIn) {
          filtered = filtered.filter((v: any) => 
            proposalIdIn.includes(v.proposalId)
          );
        }
        
        // Filter by voterAccountId_in if provided
        if (voterAccountIdIn) {
          filtered = filtered.filter((v: any) => 
            voterAccountIdIn.some((addr: string) => 
              v.voterAccountId.toLowerCase() === addr.toLowerCase()
            )
          );
        }
        
        return Promise.resolve({
          data: { data: { votesOnchains: { items: filtered, totalCount: filtered.length } } }
        });
      }

      // Handle DAOs
      if (data.query?.includes('GetDAOs')) {
        const uniqueDaoIds = [...new Set([
          ...proposals.map(p => p.daoId).filter(Boolean),
          ...votingPowerData.map(vp => vp.daoId).filter(Boolean)
        ])];
        return Promise.resolve({
          data: { data: { daos: { items: uniqueDaoIds.map(id => ({ 
            id,
            votingDelay: '0',
            chainId: (id && daoChainMapping[id]) || 1 // Default to Ethereum mainnet
          })) } } }
        });
      }

      return Promise.resolve({
        data: {
          data: {
            votingPowerHistorys: { items: [] },
            proposals: [],
            proposal: null,
            daos: { items: [] },
            votesOnchains: { items: [] }
          }
        }
      });
    };
  }
  /**
   * @notice Sets up GraphQL mock with optional data
   * @param mockHttpClient The HTTP client to mock
   * @param proposals Array of proposal data
   * @param votingPowerData Array of voting power history data  
   * @param daoChainMapping Optional mapping of DAO IDs to chain IDs
   * @param votesData Array of vote data
   */
  static setupMock(
    mockHttpClient: any, 
    proposals: ProposalData[] = [], 
    votingPowerData: ProcessedVotingPowerHistory[] = [],
    daoChainMapping: Record<string, number> = {},
    votesData: any[] = []
  ): void {
    mockHttpClient.post.mockImplementation(this.createMockImplementation(proposals, votingPowerData, daoChainMapping, votesData));
  }

  /**
   * @notice Resets the HTTP client mock to clean state
   * @param mockHttpClient The mocked HTTP client instance to reset
   */
  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }

}