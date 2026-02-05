import { NextResponse } from 'next/server';

import { getGrowthMetrics } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET() {
  try {
    const points = await getGrowthMetrics();
    return NextResponse.json({ points });
  } catch (error) {
    console.error('Failed to load growth metrics:', error);
    return NextResponse.json({ error: 'Failed to load growth metrics.' }, { status: 500 });
  }
}
