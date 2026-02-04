import { NextRequest, NextResponse } from 'next/server';

import { resolveEnsNames } from '../../../../lib/ens';
import { getUsersMetrics, UsersFilter, UsersSortDirection } from '../../../../lib/metrics';

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(parseNumber(params.get('page')) ?? 1, 1);
  const pageSize = Math.min(Math.max(parseNumber(params.get('pageSize')) ?? 20, 1), 100);
  const sortDirectionParam = params.get('sortDirection')?.toLowerCase();
  const sortDirection: UsersSortDirection =
    sortDirectionParam === 'asc' || sortDirectionParam === 'desc'
      ? sortDirectionParam
      : 'desc';

  const filters: UsersFilter = {
    dao: params.get('dao') || undefined,
    channel: params.get('channel') || undefined,
    minAddresses: parseNumber(params.get('minAddresses')),
    maxAddresses: parseNumber(params.get('maxAddresses')),
  };

  try {
    const result = await getUsersMetrics(filters, page, pageSize, sortDirection);
    const allAddresses = result.users.flatMap((user) => user.addresses);
    const { map: ensMap, available: ensAvailable } = await resolveEnsNames(allAddresses);

    const usersWithEns = result.users.map((user) => ({
      ...user,
      addresses: user.addresses.map((address) => ({
        address,
        ens: ensMap[address] ?? null,
      })),
    }));
    return NextResponse.json({
      users: usersWithEns,
      total: result.total,
      page,
      pageSize,
      sortDirection,
      ensAvailable,
    });
  } catch (error) {
    console.error('Failed to load user metrics:', error);
    return NextResponse.json({ error: 'Failed to load user metrics.' }, { status: 500 });
  }
}
