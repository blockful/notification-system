import { NextRequest, NextResponse } from 'next/server';

import { getAuthCookieValue } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'DASHBOARD_SECRET is not configured.' },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const password = formData.get('password');

  if (typeof password !== 'string' || password !== secret) {
    return NextResponse.redirect(new URL('/login?error=1', request.url));
  }

  const cookieValue = await getAuthCookieValue();
  if (!cookieValue) {
    return NextResponse.json(
      { error: 'Failed to generate auth cookie.' },
      { status: 500 }
    );
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('dashboard_auth', cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
