import { NextRequest, NextResponse } from 'next/server';

import { getTopDaos } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 10;

  try {
    const items = await getTopDaos(limit);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to load DAO metrics:', error);
    return NextResponse.json({ error: 'Failed to load DAO metrics.' }, { status: 500 });
  }
}
