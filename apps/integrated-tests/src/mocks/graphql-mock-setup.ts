import { ProposalData, OffchainProposalData } from '../fixtures';
import { ProcessedVotingPowerHistory } from '@notification-system/anticapture-client';
import { getAddress, isAddressEqual } from 'viem';

/**
 * @notice Setup class for GraphQL API mocking in integration tests
 * @dev Provides methods to mock different GraphQL endpoints with test data
 */
export class GraphQLMockSetup {

  /**
   * @notice Transforms ProcessedVotingPowerHistory to raw GraphQL format
   * @dev Returns addresses in original format (checksum) like real API
   */
  private static transformToRawGraphQLFormat(votingPowerData: ProcessedVotingPowerHistory[]): any[] {
    return votingPowerData.map(vp => ({
      accountId: vp.accountId,
      timestamp: vp.timestamp,
      votingPower: vp.votingPower,
      delta: vp.delta || null,
      daoId: vp.daoId,
      transactionHash: vp.transactionHash,
      logIndex: vp.logIndex,
      delegation: vp.delegation ? {
        from: vp.delegation.from,
        to: vp.delegation.to,
        value: vp.delegation.value,
        previousDelegate: vp.delegation.previousDelegate
      } : null,
      transfer: vp.transfer ? {
        from: vp.transfer.from,
        to: vp.transfer.to,
        value: vp.transfer.value
      } : null
    }));
  }


  /**
   * @notice Generic mock implementation that handles all query types
   */
  private static createMockImplementation(proposals: ProposalData[] = [], votingPowerData: ProcessedVotingPowerHistory[] = [], daoChainMapping: Record<string, number> = {}, votesData: any[] = [], offchainProposalsData: OffchainProposalData[] = []) {
    return (url: string, data: any, config: any) => {
      // Handle proposals
      if (data.query?.includes('ListProposals')) {

        let filtered = proposals;
        if (data.variables?.status) {
          // Status can be string or array (JSON type in GraphQL)
          const statusFilter = Array.isArray(data.variables.status)
            ? data.variables.status
            : [data.variables.status];
          filtered = filtered.filter(p => statusFilter.includes(p.status));
        }
        if (data.variables?.fromDate) {
          // Filter by creation timestamp, not end timestamp
          const beforeCount = filtered.length;
          filtered = filtered.filter(p => parseInt(p.timestamp) >= data.variables.fromDate);
        }
        if (data.variables?.fromEndDate) {
          // Filter by end timestamp
          filtered = filtered.filter(p => parseInt(p.endTimestamp) >= data.variables.fromEndDate);
        }
        if (config?.headers?.['anticapture-dao-id']) {
          filtered = filtered.filter(p => p.daoId === config.headers['anticapture-dao-id']);
        }
        return Promise.resolve({
          data: { data: { proposals: { items: filtered, totalCount: filtered.length } } }
        });
      }

      // Handle offchain proposals
      if (data.query?.includes('ListOffchainProposals')) {
        let filtered = offchainProposalsData;
        if (data.variables?.status) {
          const statusFilter = Array.isArray(data.variables.status)
            ? data.variables.status
            : [data.variables.status];
          filtered = filtered.filter(p => statusFilter.includes(p.state));
        }
        if (data.variables?.fromDate) {
          filtered = filtered.filter(p => p.created >= data.variables.fromDate);
        }
        if (data.variables?.endDate) {
          filtered = filtered.filter(p => p.end >= data.variables.endDate);
        }
        if (config?.headers?.['anticapture-dao-id']) {
          filtered = filtered.filter(p => p.daoId === config.headers['anticapture-dao-id']);
        }
        return Promise.resolve({
          data: { data: { offchainProposals: { items: filtered.map(p => ({ id: p.id, title: p.title, discussion: p.discussion, link: p.link, state: p.state, created: p.created, end: p.end })), totalCount: filtered.length } } }
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
      if (data.query?.includes('ListHistoricalVotingPower')) {
        let filtered = votingPowerData;
        if (data.variables?.fromDate) {
          // fromDate is used as timestamp_gt (greater than)
          filtered = filtered.filter(vp => parseInt(vp.timestamp) > parseInt(data.variables.fromDate));
        }
        const items = this.transformToRawGraphQLFormat(filtered);
        return Promise.resolve({
          data: { data: { historicalVotingPower: { items, totalCount: items.length } } }
        });
      }

      // Handle votes
      if (data.query?.includes('ListVotes')) {
        let filtered = votesData;

        const daoId = config?.headers?.['anticapture-dao-id'];
        const voterAddressIn = data.variables?.voterAddressIn;
        const fromDate = data.variables?.fromDate;
        const toDate = data.variables?.toDate;

        // Filter by daoId
        if (daoId) {
          filtered = filtered.filter((v: any) => v.daoId === daoId);
        }

        // Filter by voterAddressIn if provided
        if (voterAddressIn && Array.isArray(voterAddressIn)) {
          filtered = filtered.filter((v: any) =>
            voterAddressIn.some((addr: string) =>
              isAddressEqual(getAddress(v.voterAddress), getAddress(addr))
            )
          );
        }

        // Filter by fromDate if provided
        if (fromDate !== undefined) {
          filtered = filtered.filter((v: any) => v.timestamp > fromDate);
        }

        // Filter by toDate if provided
        if (toDate !== undefined) {
          filtered = filtered.filter((v: any) => v.timestamp < toDate);
        }

        // Return items in expected format
        const items = filtered.map((v: any) => ({
          transactionHash: v.transactionHash,
          proposalId: v.proposalId,
          voterAddress: v.voterAddress,
          support: v.support,
          votingPower: v.votingPower,
          timestamp: v.timestamp,
          reason: v.reason || null,
          proposalTitle: v.proposalTitle
        }));

        return Promise.resolve({
          data: { data: { votes: { items, totalCount: items.length } } }
        });
      }

      // Handle proposal non-voters
      if (data.query?.includes('ProposalNonVoters')) {
        const proposalId = data.variables?.id;
        const addressesFilter = data.variables?.addresses || [];

        // Get addresses that voted on this proposal
        const votersSet = new Set(
          votesData
            .filter((v: any) => v.proposalId === proposalId)
            .map((v: any) => getAddress(v.voterAddress).toLowerCase())
        );

        // Filter to find non-voters from the provided address list
        const nonVoterItems = addressesFilter
          .filter((addr: string) => !votersSet.has(getAddress(addr).toLowerCase()))
          .map((addr: string) => ({
            voter: getAddress(addr)
          }));

        return Promise.resolve({
          data: { data: { proposalNonVoters: { items: nonVoterItems, totalCount: nonVoterItems.length } } }
        });
      }

      // Handle DAOs
      if (data.query?.includes('GetDAOs')) {
        const uniqueDaoIds = [...new Set([
          ...proposals.map(p => p.daoId).filter(Boolean),
          ...votingPowerData.map(vp => vp.daoId).filter(Boolean),
          ...votesData.map((v: any) => v.daoId).filter(Boolean),
          ...offchainProposalsData.map(p => p.daoId).filter(Boolean)
        ])];
        return Promise.resolve({
          data: { data: { daos: { items: uniqueDaoIds.map(id => ({
            id,
            votingDelay: '0',
            chainId: (id && daoChainMapping[id]) || 1, // Default to Ethereum mainnet
            supportOffchainData: true
          })) } } }
        });
      }

      return Promise.resolve({
        data: {
          data: {
            historicalVotingPower: { items: [], totalCount: 0 },
            proposals: { items: [], totalCount: 0 },
            proposal: null,
            daos: { items: [] },
            votes: { items: [], totalCount: 0 }
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
   * @param offchainProposalsData Array of offchain (Snapshot) proposal data
   */
  static setupMock(
    mockHttpClient: any, 
    proposals: ProposalData[] = [], 
    votingPowerData: ProcessedVotingPowerHistory[] = [],
    daoChainMapping: Record<string, number> = {},
    votesData: any[] = [],
    offchainProposalsData: OffchainProposalData[] = []
  ): void {
    mockHttpClient.post.mockImplementation(this.createMockImplementation(proposals, votingPowerData, daoChainMapping, votesData, offchainProposalsData));
  }

  /**
   * @notice Resets the HTTP client mock to clean state
   * @param mockHttpClient The mocked HTTP client instance to reset
   */
  static resetMock(mockHttpClient: any): void {
    mockHttpClient.post.mockReset();
  }

}