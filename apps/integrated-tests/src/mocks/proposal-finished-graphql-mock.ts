import { HttpClientMockSetup } from './http-client-mock';

export class ProposalFinishedGraphQLMockHelper {
  static setupCleanGraphQLMock(httpMockSetup: HttpClientMockSetup, proposalsToReturn: any[] = [], testDaoId: string, blockTime: number = 12) {
    httpMockSetup.getMockClient().post.mockImplementation((url: string, data: any, config: any) => {
      if (data.query && data.query.includes('ListProposals')) {
        const requestedStatus = data.variables?.where?.status;
        const timestampGt = data.variables?.where?.timestamp_gt;
        const requestedDaoId = config?.headers?.['anticapture-dao-id'];
        
        // If new-proposal trigger is asking for pending proposals, return empty
        if (requestedStatus === 'pending') {
          return Promise.resolve({
            data: {
              data: {
                proposalsOnchains: {
                  items: []
                }
              }
            }
          });
        }
        
        // If proposal-finished trigger is asking with timestamp filter, return proposals
        if (timestampGt !== undefined) {
          let filteredProposals = proposalsToReturn;
          
          // Filter by DAO if specified
          if (requestedDaoId) {
            filteredProposals = filteredProposals.filter(p => p.daoId === requestedDaoId);
          }
          
          return Promise.resolve({
            data: {
              data: {
                proposalsOnchains: {
                  items: filteredProposals
                }
              }
            }
          });
        }
        
        // Default: return empty
        return Promise.resolve({
          data: {
            data: {
              proposalsOnchains: {
                items: []
              }
            }
          }
        });
      }
      
      // Handle voting power queries to avoid warnings
      if (data.query && data.query.includes('ListVotingPowerHistorys')) {
        return Promise.resolve({
          data: {
            data: {
              votingPowerHistorys: {
                items: []
              }
            }
          }
        });
      }
      
      if (data.query && data.query.includes('GetDAOs')) {
        const uniqueDaoIds = [...new Set(proposalsToReturn.map(p => p.daoId))];
        return Promise.resolve({
          data: {
            data: {
              daos: {
                items: uniqueDaoIds.length > 0 
                  ? uniqueDaoIds.map(daoId => ({ id: daoId, blockTime: blockTime }))
                  : [{ id: testDaoId, blockTime: blockTime }]
              }
            }
          }
        });
      }
      
      return Promise.resolve({ data: { data: {} } });
    });
  }
}