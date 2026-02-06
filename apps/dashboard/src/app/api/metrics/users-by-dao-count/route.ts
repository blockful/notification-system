import { NextResponse } from 'next/server';

import { getUsersByDaoCount } from '../../../../lib/metrics';

export const revalidate = 30;

export async function GET() {
  try {
    const items = await getUsersByDaoCount();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to load users by DAO count:', error);
    return NextResponse.json({ error: 'Failed to load users by DAO count.' }, { status: 500 });
  }
}
