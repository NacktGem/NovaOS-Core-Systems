import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateRequestSync,
  createLoginRedirect,
  createForbiddenResponse,
  AuthenticationError,
  AuthorizationError,
  NovaRole,
} from '../shared/lib/auth-utils';

// Enhanced Admin route protection middleware for GypsyCove
// Implements JWT + RBAC security with proper error handling
// Authentication via authHeader (JWT) and sessionCookie validation

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes with their required roles
  const protectedRoutes = [
    { path: '/admin', roles: ['admin', 'superadmin', 'godmode'] as NovaRole[] },
    { path: '/console', roles: ['admin', 'superadmin', 'godmode'] as NovaRole[] },
    { path: '/management', roles: ['admin', 'superadmin', 'godmode'] as NovaRole[] },
    { path: '/godmode', roles: ['godmode'] as NovaRole[] },
    { path: '/dashboard', roles: ['creator', 'admin', 'superadmin', 'godmode'] as NovaRole[] },
  ];

  // Check if current path needs protection
  const protectedRoute = protectedRoutes.find((route) => pathname.startsWith(route.path));

  if (protectedRoute) {
    try {
      // Authenticate via authHeader (JWT Bearer token) and validate sessionCookie
      authenticateRequestSync(request, protectedRoute.roles);

      // Add security headers for admin routes
      const response = NextResponse.next();
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');

      return response;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Use NextResponse.redirect for login redirect as fallback
        return (
          createLoginRedirect(request, 'authentication_required') ||
          NextResponse.redirect(new URL('/login', request.url))
        );
      }
      if (error instanceof AuthorizationError) {
        return createForbiddenResponse(
          `Access denied. Required roles: ${protectedRoute.roles.join(', ')}`
        );
      }
      return createForbiddenResponse('Authentication failed');
    }
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
