import { NextRequest, NextResponse } from 'next/server';

import { getAuthCookieValue } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const expectedCookie = await getAuthCookieValue();
  const cookie = request.cookies.get('dashboard_auth')?.value;

  if (!expectedCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'DASHBOARD_SECRET not configured.' }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/login?error=1', request.url));
  }

  if (cookie === expectedCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
