import { NextResponse } from 'next/server';

import { getSummaryMetrics } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET() {
  try {
    const summary = await getSummaryMetrics();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to load summary metrics:', error);
    return NextResponse.json({ error: 'Failed to load summary metrics.' }, { status: 500 });
  }
}
