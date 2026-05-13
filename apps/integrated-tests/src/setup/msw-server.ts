import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  proposalsHandler,
  offchainProposalsHandler,
  votesHandler,
  votesOffchainHandler,
  historicalVotingPowerHandler,
  getEventRelevanceThresholdHandler,
  proposalNonVotersHandler,
  offchainProposalNonVotersHandler,
  votesByProposalIdHandler,
  votesOffchainByProposalIdHandler,
  getDaosHandler
} from '@anticapture/client/msw';
import { testConstants } from '../config';

export const MOCK_ANTICAPTURE_URL = 'http://mock.anticapture.local';

type NonVoterResolverVote = {
  proposalId?: string;
  voter?: string;
  voterAddress?: string;
};

export const nonVotersResolver =
  (votes: ReadonlyArray<NonVoterResolverVote>) =>
  ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    const proposalId = (params.id ?? params.proposalId) as string;
    const addresses = new URL(request.url).searchParams.getAll('addresses');
    const voters = new Set(
      votes
        .filter(v => v.proposalId === proposalId)
        .map(v => (v.voterAddress ?? v.voter ?? '').toLowerCase()),
    );
    const items = addresses
      .filter(a => !voters.has(a.toLowerCase()))
      .map(voter => ({ voter }));
    return HttpResponse.json({ items, totalCount: items.length });
  };

const emptyListEnvelope = { items: [], totalCount: 0 };
const emptyThreshold = { threshold: 0 };

const testDaos = Object.values(testConstants.daoIds).map(id => ({
  id,
  votingDelay: '0',
  supportOffchainData: true
}));

export const defaultHandlers = [
  getDaosHandler({ items: testDaos, totalCount: testDaos.length }),
  offchainProposalsHandler(emptyListEnvelope),
  votesOffchainHandler(emptyListEnvelope),
  offchainProposalNonVotersHandler(emptyListEnvelope),
  votesOffchainByProposalIdHandler(emptyListEnvelope),
  proposalsHandler(emptyListEnvelope),
  votesHandler(emptyListEnvelope),
  historicalVotingPowerHandler(emptyListEnvelope),
  getEventRelevanceThresholdHandler(emptyThreshold),
  proposalNonVotersHandler(emptyListEnvelope),
  votesByProposalIdHandler(emptyListEnvelope)
];

export const server = setupServer(...defaultHandlers);
