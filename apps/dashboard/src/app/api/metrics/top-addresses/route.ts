import { NextRequest, NextResponse } from 'next/server';

import { resolveEnsNames } from '../../../../lib/ens';
import { getTopFollowedAddresses } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 10;

  try {
    const items = await getTopFollowedAddresses(limit);
    const addresses = items.map((item) => item.address);
    const { map: ensMap, available: ensAvailable } = await resolveEnsNames(addresses);

    const itemsWithEns = items.map((item) => ({
      ...item,
      ens: ensMap[item.address] ?? null,
    }));

    return NextResponse.json({ items: itemsWithEns, ensAvailable });
  } catch (error) {
    console.error('Failed to load top followed addresses:', error);
    return NextResponse.json({ error: 'Failed to load top followed addresses.' }, { status: 500 });
  }
}
