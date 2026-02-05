import { NextRequest, NextResponse } from 'next/server';

import { getNotificationActivityByDay } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const dao = request.nextUrl.searchParams.get('dao') || undefined;

  try {
    const points = await getNotificationActivityByDay(dao);
    return NextResponse.json({ points });
  } catch (error) {
    console.error('Failed to load notification activity:', error);
    return NextResponse.json(
      { error: 'Failed to load notification activity.' },
      { status: 500 }
    );
  }
}
