import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ['/admin', '/console', '/management', '/godmode', '/dashboard'];

  // Check if current path needs protection
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // For now, just redirect to login - we'll implement proper auth later
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to proceed for non-protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/console/:path*',
    '/management/:path*',
    '/godmode/:path*',
    '/dashboard/:path*',
  ],
};
