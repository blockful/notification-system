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
  daosHandler
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

// SDK handlers echo their data verbatim — `:dao` and `?status` are not honored.
// Tests that poll across multiple DAOs or statuses need that filtering, so we
// recreate it here against the seeded item list.
export const proposalsByDaoResolver =
  <T extends { daoId: string; status?: string | null }>(items: ReadonlyArray<T>) =>
  ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    const dao = params.dao as string;
    const statuses = new URL(request.url).searchParams.getAll('status').map(s => s.toLowerCase());
    const filtered = items.filter(item => {
      if (item.daoId !== dao) return false;
      if (statuses.length === 0) return true;
      return statuses.includes((item.status ?? '').toLowerCase());
    });
    return HttpResponse.json({ items: filtered, totalCount: filtered.length });
  };

// Offchain (Snapshot) variant. Watch the asymmetry: the query param is
// `?status=active|closed` but the payload field is `state` — we match against
// the payload side.
export const offchainProposalsByDaoResolver =
  <T extends { spaceId: string; state?: string | null }>(items: ReadonlyArray<T>) =>
  ({ request, params }: { request: Request; params: Record<string, string | readonly string[] | undefined> }) => {
    const dao = params.dao as string;
    const statuses = new URL(request.url).searchParams.getAll('status').map(s => s.toLowerCase());
    const filtered = items.filter(item => {
      if (item.spaceId !== dao) return false;
      if (statuses.length === 0) return true;
      return statuses.includes((item.state ?? '').toLowerCase());
    });
    return HttpResponse.json({ items: filtered, totalCount: filtered.length });
  };

// getDaos gates which DAOs ever get polled: a DAO absent from this response
// stays invisible no matter what proposals or votes are seeded for it. Use
// this when a test introduces a DAO id outside the default `testDaos` set.
type WithDao = { daoId: string } | { spaceId: string };
const idOf = (p: WithDao) => ('daoId' in p ? p.daoId : p.spaceId);
export const daosFromItems = (items: ReadonlyArray<WithDao>) => {
  const ids = Array.from(new Set(items.map(idOf)));
  return daosHandler({
    items: ids.map(id => ({ id, votingDelay: '0', supportsOffchainData: true })),
    totalCount: ids.length,
  });
};

const emptyListEnvelope = { items: [], totalCount: 0 };
const emptyThreshold = { threshold: 0 };

const testDaos = Object.values(testConstants.daoIds).map(id => ({
  id,
  votingDelay: '0',
  supportsOffchainData: true
}));

export const defaultHandlers = [
  daosHandler({ items: testDaos, totalCount: testDaos.length }),
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
